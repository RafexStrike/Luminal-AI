// FILE: src/lib/interactive/INTERACTIVE_ragHelper.js
// DESCRIPTION: Fetches RAG chunks and formats them as a prompt-ready string
// RESPONSIBILITY: Retrieve and truncate — nothing else.

import { retrieveContext } from '@/lib/rag/retriever.js';

const DEFAULT_TOP_K = 5;
// Budget per chunk in characters before truncation (≈ 500 chars per KB spec limit)
const DEFAULT_CHAR_BUDGET = 450;

/**
 * Fetch top-N RAG chunks for a query and return a single formatted string
 * that can be injected directly into the {{KB_SNIPPETS}} prompt slot.
 *
 * Gracefully degrades — if RAG fails, returns an empty string so generation
 * can still proceed without context.
 *
 * @param {Object} params
 * @param {string} params.userId     — Authenticated user ID for multi-tenancy
 * @param {string} params.query      — The user query to retrieve context for
 * @param {number} [params.topK]     — Max chunks to retrieve (default: 5)
 * @param {number} [params.charBudget] — Max chars per chunk (default: 450)
 *
 * @returns {Promise<string>} Formatted KB snippets string (may be empty)
 */
export async function fetchRAGSnippets({
    userId,
    query,
    topK = DEFAULT_TOP_K,
    charBudget = DEFAULT_CHAR_BUDGET,
}) {
    console.log('INTERACTIVE: fetchRAGSnippets called', { userId, queryLength: query?.length, topK });

    try {
        const result = await retrieveContext({ userId, query, topK });

        if (!result || !result.results || result.results.length === 0) {
            console.log('INTERACTIVE: RAG returned no results', { query });
            return '';
        }

        // Truncate each chunk to charBudget and format for prompt injection
        const snippets = result.results
            .slice(0, topK)
            .map((doc, idx) => {
                const truncated =
                    doc.text.length > charBudget ? doc.text.slice(0, charBudget) + '…' : doc.text;
                return `[${idx + 1}] (${doc.sourceType}) ${truncated}`;
            })
            .join('\n');

        console.log('INTERACTIVE: RAG snippets ready', {
            count: result.results.length,
            totalChars: snippets.length,
        });

        return snippets;
    } catch (err) {
        console.error('INTERACTIVE ERROR: fetchRAGSnippets failed — proceeding without context', err);
        return '';
    }
}
