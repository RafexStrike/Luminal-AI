// FILE: src/lib/rag/revisePromptBuilder.js
// DESCRIPTION: Builds the system + user prompts for the Revise feature
// PURPOSE: Simple, reliable prompt — no JSON requirement, plain text answer

/**
 * Build a revision prompt for the LLM.
 *
 * @param {Array}  chunks    - Retrieved context chunks [{text, similarity}]
 * @param {string} userQuery - The user's question
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildRevisePrompt({ chunks = [], userQuery }) {
    if (!userQuery) throw new Error('userQuery is required');

    const contextBlocks = formatContextBlocks(chunks);

    const systemPrompt = `You are a helpful study tutor. The user has provided their own study materials below as context.

Your rules:
- Answer the user's question using ONLY the provided study materials.
- If the study materials do not contain enough information to answer, clearly say: "I don't have enough information in your study materials to answer this."
- Do NOT make up facts or use outside knowledge.
- Write your answer in clear, well-formatted markdown.
- Be concise but thorough.`;

    const userPrompt = `Here are my study materials:

${contextBlocks}

---

My question: ${userQuery}`;

    return { systemPrompt, userPrompt };
}

/**
 * Format chunks into numbered context blocks for the prompt.
 */
function formatContextBlocks(chunks) {
    if (!chunks || chunks.length === 0) return '(No study materials available)';

    return chunks.map((chunk, i) => {
        const snippet = (chunk.text || '').substring(0, 600);
        return `[Material ${i + 1}]\n${snippet}`;
    }).join('\n\n');
}
