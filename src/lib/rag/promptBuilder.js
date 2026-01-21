// FILE: src/lib/rag/promptBuilder.js
// DESCRIPTION: Augments prompts with RAG-retrieved context
// PURPOSE: Transforms retrieved documents into structured context that enhances LLM responses
//
// This module formats RAG results into a clear, structured context block
// that the LLM can use while maintaining the original request intent.

/**
 * Build an augmented prompt by prepending context from RAG retrieval
 *
 * @param {Object} params
 * @param {string} params.originalPrompt - The user's original message
 * @param {Object} params.retrievalResults - Output from retrieveContext()
 *
 * @returns {string} The augmented prompt with context
 */
export function augmentPrompt({ originalPrompt, retrievalResults }) {
  if (!originalPrompt || !retrievalResults) {
    throw new Error('Missing required fields: originalPrompt, retrievalResults');
  }

  const { results = [] } = retrievalResults;

  // If no results found, return original prompt unchanged
  if (results.length === 0) {
    return originalPrompt;
  }

  // Build context block
  const contextBlock = buildContextBlock(results);

  // Combine context with original prompt
  const augmented = `${contextBlock}\n\n---\n\n${originalPrompt}`;

  return augmented;
}

/**
 * Build a formatted context block from retrieved documents
 *
 * @param {Array} results - Array of retrieved documents
 * @returns {string} Formatted context section
 */
function buildContextBlock(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return '';
  }

  // Group results by source type for clarity
  const grouped = groupBySourceType(results);

  let block = '## CONTEXT FROM YOUR NOTES\n\n';
  block += 'The following relevant information has been retrieved from your study materials:\n\n';

  Object.entries(grouped).forEach(([sourceType, docs]) => {
    block += `### ${formatSourceType(sourceType)} (${docs.length} item${docs.length > 1 ? 's' : ''})\n\n`;

    docs.forEach((doc, index) => {
      const similarityPercent = Math.round(doc.similarity * 100);
      block += `**${index + 1}. Relevance: ${similarityPercent}%**\n`;
      block += `${doc.text}\n\n`;

      // Add metadata if available and relevant
      if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        const metaStr = Object.entries(doc.metadata)
          .filter(([_, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');

        if (metaStr) {
          block += `_Metadata: ${metaStr}_\n\n`;
        }
      }
    });
  });

  block += '---\n';

  return block;
}

/**
 * Group documents by their source type
 *
 * @param {Array} results - Retrieved documents
 * @returns {Object} Grouped by sourceType
 */
function groupBySourceType(results) {
  return results.reduce((acc, doc) => {
    const type = doc.sourceType || 'unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {});
}

/**
 * Format source type for human-readable display
 *
 * @param {string} sourceType - The source type (flashcard, quiz, note, video)
 * @returns {string} Formatted display name
 */
function formatSourceType(sourceType) {
  const mapping = {
    flashcard: 'Flashcards',
    quiz: 'Quizzes',
    note: 'Notes',
    video: 'Videos',
  };

  return mapping[sourceType] || sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
}

/**
 * Build a compact prompt augmentation (for token efficiency)
 * Reduces context overhead compared to augmentPrompt()
 *
 * @param {Object} params
 * @param {string} params.originalPrompt - The user's original message
 * @param {Object} params.retrievalResults - Output from retrieveContext()
 *
 * @returns {string} Compact augmented prompt
 */
export function augmentPromptCompact({ originalPrompt, retrievalResults }) {
  if (!originalPrompt || !retrievalResults) {
    throw new Error('Missing required fields: originalPrompt, retrievalResults');
  }

  const { results = [] } = retrievalResults;

  // If no results, return original
  if (results.length === 0) {
    return originalPrompt;
  }

  // Build minimal context
  let compact = '[RETRIEVED CONTEXT]\n';

  results.slice(0, 3).forEach((doc) => {
    const similarityPercent = Math.round(doc.similarity * 100);
    compact += `• [${doc.sourceType}] ${doc.text.substring(0, 100)}... (${similarityPercent}% relevant)\n`;
  });

  if (results.length > 3) {
    compact += `• ... and ${results.length - 3} more results\n`;
  }

  compact += '\n';
  compact += originalPrompt;

  return compact;
}

/**
 * Inject RAG context as system prompt instructions
 * Tells the LLM to use the provided context
 *
 * @param {Object} params
 * @param {string} params.originalSystemPrompt - The original system prompt
 * @param {number} params.resultCount - Number of context items provided
 *
 * @returns {string} Enhanced system prompt
 */
export function augmentSystemPrompt({
  originalSystemPrompt = '',
  resultCount = 0,
}) {
  // Original system prompt is optional. If not provided, we'll return a minimal augmentation.
  if (resultCount === 0) {
    return originalSystemPrompt;
  }

  const enhancement = `

You have been provided with ${resultCount} relevant document(s) from the user's study materials (labeled "CONTEXT FROM YOUR NOTES"). 
Please refer to and cite these materials when applicable to answer the user's question.`;

  // If there is an original system prompt, append enhancement. Otherwise return enhancement alone.
  return (originalSystemPrompt || '') + enhancement;
}
