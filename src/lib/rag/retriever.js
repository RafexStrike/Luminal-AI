// FILE: src/lib/rag/retriever.js
// DESCRIPTION: Orchestrates document retrieval and ranking
// PURPOSE: Retrieves relevant context from the vector store based on query similarity
//
// This is an OPTIONAL component that:
// - Only runs when RAG is explicitly requested
// - Does NOT modify any existing data or queries
// - Returns formatted context that can be augmented into prompts

import { embedText } from './embedder.js';
import { retrieveSimilar } from './vectorStore.js';
import { RAG_CONTENT_TYPES } from './content-types.js';

/**
 * Retrieve relevant documents for a user's query
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for multi-tenancy
 * @param {string} params.query - The user's question or message
 * @param {string[]} params.sourceTypes - Which sources to search (e.g., ["flashcard", "note"])
 * @param {number} params.topK - How many results to return (default: 5)
 * @param {number} params.threshold - Minimum similarity score (0-1, optional)
 *
 * @returns {Object} { query, embedding, results: [{...}], totalRetrieved }
 */
export async function retrieveContext({
  userId,
  query,
  sourceTypes = RAG_CONTENT_TYPES,
  topK = 5,
  threshold = 0.3,
}) {
  if (!userId || !query) {
    throw new Error('Missing required fields: userId, query');
  }

  try {
    // Step 1: Embed the user's query
    let queryEmbedding;
    try {
      queryEmbedding = await embedText(query);
    } catch (embedError) {
      console.warn(
        '[RAG] Embedding failed, attempting recovery:',
        embedError.message
      );
      // Return empty results instead of throwing - RAG is optional
      return {
        query,
        embedding: null,
        results: [],
        totalRetrieved: 0,
        error: 'Embedding failed, context unavailable',
      };
    }

    // Step 2: Search for similar documents in vector store
    let results;
    try {
      results = await retrieveSimilar({
        userId,
        queryEmbedding,
        sourceTypes,
        topK,
        threshold,
      });
    } catch (searchError) {
      console.warn('[RAG] Vector search failed:', searchError.message);
      // Return empty results - search failed but embedding succeeded
      return {
        query,
        embedding: queryEmbedding,
        results: [],
        totalRetrieved: 0,
        error: 'Vector search failed, context unavailable',
      };
    }

    // Step 3: Format results for use in prompt augmentation
    const formattedResults = results.map((doc) => ({
      id: doc._id?.toString(),
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      text: doc.text,
      similarity: doc.similarity,
      metadata: doc.metadata || {},
    }));

    return {
      query,
      embedding: queryEmbedding,
      results: formattedResults,
      totalRetrieved: formattedResults.length,
    };
  } catch (error) {
    console.error('[RAG] Unexpected error in retrieveContext:', error.message);
    // Still return gracefully
    return {
      query,
      embedding: null,
      results: [],
      totalRetrieved: 0,
      error: error.message,
    };
  }
}

/**
 * Retrieve context from specific sources only
 * Convenience wrapper for common use cases
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.query - The query
 * @param {'flashcard' | 'quiz' | 'note' | 'video'} params.sourceType - Single source type
 * @param {number} params.topK - How many results
 *
 * @returns {Object} Retrieval results
 */
export async function retrieveFromSource({
  userId,
  query,
  sourceType,
  topK = 5,
}) {
  return retrieveContext({
    userId,
    query,
    sourceTypes: [sourceType],
    topK,
  });
}

/**
 * Retrieve all available sources for user context (for UI previews)
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.query - The query
 * @param {number} params.topKPerSource - Results per source (default: 3)
 *
 * @returns {Object} { query, bySource: { flashcard: [...], quiz: [...], note: [...] } }
 */
export async function retrieveBySource({
  userId,
  query,
  topKPerSource = 3,
}) {
  if (!userId || !query) {
    throw new Error('Missing required fields: userId, query');
  }

  try {
    const queryEmbedding = await embedText(query);
    const sources = RAG_CONTENT_TYPES;
    const bySource = {};

    // Retrieve from each source separately
    for (const sourceType of sources) {
      const results = await retrieveSimilar({
        userId,
        queryEmbedding,
        sourceTypes: [sourceType],
        topK: topKPerSource,
      });

      bySource[sourceType] = results.map((doc) => ({
        id: doc._id?.toString(),
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        text: doc.text,
        similarity: doc.similarity,
        metadata: doc.metadata || {},
      }));
    }

    return {
      query,
      bySource,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve by source: ${error.message}`);
  }
}
