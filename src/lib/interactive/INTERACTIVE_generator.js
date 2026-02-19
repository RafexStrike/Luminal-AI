// FILE: src/lib/interactive/INTERACTIVE_generator.js
// DESCRIPTION: Orchestrates RAG → prompt → HF inference → parse → validate
// RESPONSIBILITY: One function — generate an interactive spec or bundle. Log everything.

import { getHfClient } from '@/lib/hfClient.js';
import { fetchRAGSnippets } from './INTERACTIVE_ragHelper.js';
import { buildInteractivePrompt } from './INTERACTIVE_promptBuilder.js';
import { validateInteractiveSpec } from './INTERACTIVE_schema.js';
import { sanitizeBundle } from './INTERACTIVE_bundleBuilder.js';
import { nanoid } from 'nanoid';

// HuggingFace model — same as the rest of the stack
const HF_MODEL = 'deepseek-ai/DeepSeek-V3.2';
const HF_TEMPERATURE = 0.0;
const HF_MAX_TOKENS = 1200;

// Dev flag: log full raw LLM output only in non-production
const LOG_FULL_OUTPUT = process.env.NODE_ENV !== 'production';

/**
 * Generate an interactive explainer spec or HTML bundle.
 *
 * @param {Object} params
 * @param {string} params.query   — Raw user query (may include "@interactive" token)
 * @param {string} params.title   — Human-readable title for the explainer
 * @param {string} [params.mode]  — "spec" (default) or "bundle"
 * @param {string} params.userId  — Authenticated user ID (for RAG multi-tenancy)
 *
 * @returns {Promise<{ kind: 'spec'|'bundle'|'error', payload: object }>}
 */
export async function generateInteractive({ query, title, mode = 'spec', userId }) {
    const requestId = nanoid(8);
    console.group(`INTERACTIVE: generator entered [${requestId}]`);
    console.log('INTERACTIVE: generator entered', { query, title, mode, userId, requestId });

    try {
        // ── Step 1: Fetch RAG context ──────────────────────────────────────────
        console.log('INTERACTIVE: fetching RAG snippets', { requestId });
        const kbSnippets = await fetchRAGSnippets({ userId, query });

        // ── Step 2: Build prompt ──────────────────────────────────────────────
        console.log('INTERACTIVE: building prompt', { requestId });
        const { systemPrompt, userPrompt } = buildInteractivePrompt({
            query,
            title,
            kbSnippets,
        });

        // ── Step 3: Call HuggingFace ──────────────────────────────────────────
        console.log('INTERACTIVE: calling HF inference', { model: HF_MODEL, temperature: HF_TEMPERATURE, requestId });
        const client = getHfClient();

        let rawOutput = await callHF(client, systemPrompt, userPrompt);

        if (LOG_FULL_OUTPUT) {
            console.log('INTERACTIVE: raw LLM output (dev only)', { rawOutput, requestId });
        } else {
            // Log a short hash for traceability in production
            const hash = rawOutput.slice(0, 12) + '…';
            console.log('INTERACTIVE: raw LLM output hash', { hash, requestId });
        }

        // ── Step 4: Parse JSON ────────────────────────────────────────────────
        let parsed = tryParseJSON(rawOutput);

        if (parsed === null) {
            // Retry with post-processing — strip markdown fences if model wrapped output
            console.warn('INTERACTIVE: first parse failed, attempting post-process', { requestId });
            const cleaned = postProcessRawOutput(rawOutput);
            parsed = tryParseJSON(cleaned);

            if (parsed === null) {
                console.error('INTERACTIVE ERROR: JSON parse failed after retry', {
                    rawOutput: LOG_FULL_OUTPUT ? rawOutput : rawOutput.slice(0, 100),
                    requestId,
                });
                return buildError('JSON parse failed after retry — model may not have returned valid JSON', [], requestId);
            }
        }

        // ── Step 5: Handle bundle mode ────────────────────────────────────────
        if (mode === 'bundle') {
            // For bundle mode we expect a raw HTML string from the model
            const rawHtml = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
            const { safeHtml, warnings } = sanitizeBundle(rawHtml);
            console.log('INTERACTIVE: returning valid bundle', { warnings, requestId });
            console.groupEnd();
            return { kind: 'bundle', payload: { safeHtml, warnings } };
        }

        // ── Step 6: Validate spec ─────────────────────────────────────────────
        const { valid, errors } = validateInteractiveSpec(parsed);
        if (!valid) {
            console.error('INTERACTIVE ERROR: validation failed', { errors, requestId });
            console.groupEnd();
            return buildError('Schema validation failed', errors, requestId);
        }

        console.log('INTERACTIVE: returning valid spec', { title: parsed.title, steps: parsed.steps?.length, requestId });
        console.groupEnd();
        return { kind: 'spec', payload: parsed };

    } catch (err) {
        console.error('INTERACTIVE ERROR: generator threw unexpectedly', { err, requestId });
        console.groupEnd();
        return buildError('Unexpected generator error', [err.message], requestId);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Private helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Call HuggingFace chatCompletion and return the raw text response.
 * @private
 */
async function callHF(client, systemPrompt, userPrompt) {
    const response = await client.chatCompletion({
        model: HF_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: HF_TEMPERATURE,
        max_tokens: HF_MAX_TOKENS,
    });

    return response?.choices?.[0]?.message?.content || '';
}

/**
 * Try JSON.parse; return parsed object or null on failure.
 * @private
 */
function tryParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Strip common model artifacts like markdown code fences and leading prose.
 * Extracts the first JSON object found in the string.
 * @private
 */
function postProcessRawOutput(text) {
    // Remove markdown code fences: ```json ... ``` or ``` ... ```
    let cleaned = text.replace(/^```(?:json)?\s*/im, '').replace(/\s*```$/im, '').trim();

    // Try to extract the first { ... } block in case of surrounding prose
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        return match[0];
    }

    return cleaned;
}

/**
 * Build a standardised error response payload.
 * @private
 */
function buildError(message, details, requestId) {
    return {
        kind: 'error',
        payload: {
            message,
            details: Array.isArray(details) ? details : [String(details)],
            debugHint: `INTERACTIVE: logged full LLM output to server logs id=${requestId}`,
        },
    };
}
