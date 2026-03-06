// FILE: src/lib/tutoring/questionGenerator.js
// DESCRIPTION: Single-turn adaptive Socratic question generation via HuggingFace
// RESPONSIBILITY: Build adaptive prompt → call HF → parse → return one question turn.
//
// Unlike the batch INTERACTIVE_generator.js which generates 3–5 turns at once,
// this module generates exactly ONE question per call, conditioned on:
//   - The student's current mastery level
//   - The student's IRT ability estimate
//   - The recent conversation history (last 3 turns)
//   - The selected pedagogical strategy
//   - RAG context snippets

import { getHfClient } from '@/lib/hfClient.js';
import { strategyLabel } from './strategyPolicy.js';
import { averageMastery } from './bkt.js';

const HF_MODEL = 'deepseek-ai/DeepSeek-V3.2';
const HF_TEMPERATURE = 0.3;   // Slightly warmer than batch generator for variety
const HF_MAX_TOKENS = 400;

const LOG_FULL_OUTPUT = process.env.NODE_ENV !== 'production';

/**
 * Generate the next adaptive Socratic question for a student.
 *
 * @param {Object} params
 * @param {Object} params.session      — current session (from sessionManager)
 * @param {string} params.strategy     — current pedagogical strategy (from strategyPolicy)
 * @param {string} [params.kbSnippets] — pre-fetched RAG context string
 *
 * @returns {Promise<{
 *   nextQuestion: string,
 *   hint:         string,
 *   concepts:     string[],
 *   viz_type:     string,
 * }>}
 */
export async function generateNextQuestion({ session, strategy, kbSnippets = '' }) {
    console.log('TUTORING: generateNextQuestion called', {
        sessionId: session.sessionId,
        turn: session.turn,
        strategy,
    });

    const avgMastery = averageMastery(session.mastery);
    const recentHistory = session.history.slice(-3); // last 3 turns for context window

    const { systemPrompt, userPrompt } = buildAdaptivePrompt({
        topic: session.topic,
        mastery: avgMastery,
        ability: session.ability,
        strategy,
        history: recentHistory,
        kbSnippets,
    });

    const client = getHfClient();
    const rawOutput = await callHF(client, systemPrompt, userPrompt);

    if (LOG_FULL_OUTPUT) {
        console.log('TUTORING: raw LLM output', { rawOutput });
    }

    const parsed = tryParseJSON(rawOutput) ?? tryParseJSON(postProcess(rawOutput));

    if (!parsed) {
        console.error('TUTORING ERROR: JSON parse failed', {
            raw: LOG_FULL_OUTPUT ? rawOutput : rawOutput.slice(0, 100),
        });
        // Graceful fallback — return a generic probing question so the loop can continue
        return buildFallback(session.topic, strategy);
    }

    return {
        nextQuestion: parsed.question ?? buildFallback(session.topic, strategy).nextQuestion,
        hint: parsed.hint ?? 'Think about the core concept and what you already know.',
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [session.topic],
        viz_type: parsed.viz_type ?? 'process_steps',
    };
}

/**
 * Evaluate whether a student's free-text answer is correct for the topic.
 * Returns a boolean — uses a lightweight LLM call with a strict yes/no prompt.
 *
 * @param {Object} params
 * @param {string} params.topic          — topic of the session
 * @param {string} params.question       — the question that was asked
 * @param {string} params.studentAnswer  — the student's free-text answer
 *
 * @returns {Promise<boolean>} true if the answer demonstrates understanding
 */
export async function evaluateAnswer({ topic, question, studentAnswer }) {
    console.log('TUTORING: evaluateAnswer called', {
        topic,
        questionLength: question?.length,
        answerLength: studentAnswer?.length,
    });

    if (!studentAnswer || !studentAnswer.trim()) {
        return false; // Empty answer is incorrect
    }

    // Check for explicit "explain" / "I give up" signals → treat as incorrect
    const exitPhrases = ['explain', 'i give up', 'i don\'t know', 'tell me', 'show me'];
    const lower = studentAnswer.toLowerCase();
    if (exitPhrases.some((p) => lower.includes(p))) {
        console.log('TUTORING: student requested explanation — marking incorrect');
        return false;
    }

    const systemPrompt = `You are an expert tutor grading a student's answer. 
Respond with EXACTLY one JSON object: {"correct": true} or {"correct": false}.
A correct answer demonstrates meaningful understanding of the concept — it doesn't have to be perfectly worded.
Do NOT output anything else.`;

    const userPrompt = `Topic: ${topic}
Question asked: ${question}
Student answer: ${studentAnswer}

Is this answer correct? Respond only with {"correct": true} or {"correct": false}.`;

    try {
        const client = getHfClient();
        const raw = await callHF(client, systemPrompt, userPrompt);
        const parsed = tryParseJSON(raw) ?? tryParseJSON(postProcess(raw));
        if (parsed && typeof parsed.correct === 'boolean') {
            console.log('TUTORING: evaluateAnswer result', { correct: parsed.correct });
            return parsed.correct;
        }
        // Fallback: keyword heuristic
        return /\btrue\b/i.test(raw);
    } catch (err) {
        console.error('TUTORING ERROR: evaluateAnswer threw', err);
        return false; // Fail safe → mark incorrect, let BKT update conservatively
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Build the system + user prompt for adaptive single-turn question generation.
 * @private
 */
function buildAdaptivePrompt({ topic, mastery, ability, strategy, history, kbSnippets }) {
    const masteryPct = Math.round(mastery * 100);
    const abilityLabel = ability > 1.5 ? 'advanced' : ability < -1.5 ? 'beginner' : 'intermediate';
    const historyText = history.length === 0
        ? 'No previous turns — this is the opening question.'
        : history.map((t, i) =>
            `Turn ${i + 1}: Q: "${t.question}" | A: "${t.studentAnswer}" | Correct: ${t.isCorrect}`
        ).join('\n');

    const stratDesc = strategyLabel(strategy);

    const systemPrompt = `You are an adaptive Socratic tutor. You output ONLY a single JSON object — no prose, no markdown.
Your single goal: generate ONE question that advances the student's understanding of the topic.

PEDAGOGICAL STRATEGY: ${stratDesc}

RULES:
- Ask exactly ONE question — never multiple questions in one turn
- The question must align precisely with the strategy above
- Never directly explain — ask instead
- Output ONLY JSON matching this schema exactly:
{
  "question": "<your Socratic question, 10-300 chars>",
  "hint": "<gentle nudge if student is stuck, 10-200 chars — still a question, not an answer>",
  "concepts": ["<1-3 key concepts this question probes>"],
  "viz_type": "<one of: nodes_forming | data_flowing | layers_stacking | concept_branching | comparison | process_steps>"
}`;

    const userPrompt = `Topic: "${topic}"
Student mastery: ${masteryPct}% (${abilityLabel} ability)

Recent conversation history:
${historyText}

KB context (use to inform questions, do not quote directly):
${kbSnippets || 'None available.'}

Generate the next adaptive Socratic question. Output only JSON.`;

    return { systemPrompt, userPrompt };
}

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
    return response?.choices?.[0]?.message?.content ?? '';
}

/** Try JSON.parse, return null on failure. @private */
function tryParseJSON(text) {
    try { return JSON.parse(text); } catch { return null; }
}

/** Strip markdown fences and extract first JSON object. @private */
function postProcess(text) {
    const cleaned = text.replace(/^```(?:json)?\s*/im, '').replace(/\s*```$/im, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : cleaned;
}

/** Graceful fallback when LLM parse fails. @private */
function buildFallback(topic, strategy) {
    console.warn('TUTORING: using fallback question for topic', { topic, strategy });
    return {
        nextQuestion: `What do you understand so far about "${topic}"? Describe it in your own words.`,
        hint: 'Start with what you are most confident about — any aspect of the topic is fine.',
        concepts: [topic],
        viz_type: 'concept_branching',
    };
}
