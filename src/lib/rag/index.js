// FILE: src/lib/rag/index.js
// DESCRIPTION: RAG system entry point and main orchestration
// PURPOSE: Provides a clean, optional wrapper for RAG functionality
//
// KEY DESIGN PRINCIPLE: This module is COMPLETELY OPTIONAL
// - If RAG metadata is not provided, nothing happens
// - Existing code paths remain untouched
// - RAG only activates when explicitly requested via the API

import { retrieveContext, retrieveBySource } from "./retriever.js";
import { augmentPrompt, augmentSystemPrompt } from "./promptBuilder.js";
import { embedText } from "./embedder.js";
import { storeEmbedding, retrieveSimilar } from "./vectorStore.js";

/**
 * Process a message with optional RAG enhancement
 *
 * This is the main entry point for RAG integration.
 * Call this INSTEAD of calling the LLM directly if you want RAG.
 * If RAG metadata is not provided, it's a no-op.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for multi-tenancy
 * @param {string} params.prompt - The user's message/question
 * @param {Object} params.ragConfig - RAG configuration (optional)
 * @param {string[]} params.ragConfig.sources - Sources to retrieve from (e.g., ["flashcard"])
 * @param {number} params.ragConfig.topK - Number of results (default: 5)
 * @param {number} params.ragConfig.threshold - Similarity threshold (default: 0.3)
 *
 * @returns {Object} { augmentedPrompt, retrievalResults, systemPromptAddendum }
 *                   If RAG is not enabled, augmentedPrompt === prompt
 */
export async function processWithRAG({ userId, prompt, ragConfig = null }) {
  // If no RAG config provided, return prompt as-is (no enhancement)
  if (!ragConfig) {
    return {
      augmentedPrompt: prompt,
      retrievalResults: null,
      systemPromptAddendum: "",
      ragEnabled: false,
    };
  }

  try {
    const {
      sources = ["flashcard", "quiz", "note"],
      topK = 5,
      threshold = 0.3,
    } = ragConfig;

    console.log("[RAG] Starting retrieval for sources:", sources);

    // Step 1: Retrieve relevant context
    let retrievalResults;
    try {
      retrievalResults = await retrieveContext({
        userId,
        query: prompt,
        sourceTypes: sources,
        topK,
        threshold,
      });
      console.log(
        `[RAG] Retrieved ${retrievalResults.results.length} documents`,
      );
    } catch (retrievelError) {
      console.error("[RAG] Context retrieval failed:", retrievelError.message);
      // Continue with empty results instead of breaking
      retrievalResults = {
        query: prompt,
        embedding: null,
        results: [],
        totalRetrieved: 0,
        error: retrievelError.message,
      };
    }

    // If no results, still return gracefully
    if (retrievalResults.results.length === 0) {
      console.log("[RAG] No context retrieved, using original prompt");
      return {
        augmentedPrompt: prompt,
        retrievalResults,
        systemPromptAddendum: "",
        ragEnabled: false,
        contextRetrieved: 0,
      };
    }

    // Step 2: Augment the prompt with retrieved context
    try {
      const augmentedPrompt = augmentPrompt({
        originalPrompt: prompt,
        retrievalResults,
      });

      // Step 3: Create system prompt enhancement
      const systemPromptAddendum = augmentSystemPrompt({
        originalSystemPrompt: "",
        resultCount: retrievalResults.results.length,
      });

      console.log({
        augmentPrompt: augmentPrompt,
        systemPromptAddendum: systemPromptAddendum,
      });
      console.log("[RAG] Augmentation successful");

      return {
        augmentedPrompt,
        retrievalResults,
        systemPromptAddendum,
        ragEnabled: true,
        contextRetrieved: retrievalResults.results.length,
      };
    } catch (augmentError) {
      console.error("[RAG] Augmentation failed:", augmentError.message);
      // Return with original prompt if augmentation fails
      return {
        augmentedPrompt: prompt,
        retrievalResults,
        systemPromptAddendum: "",
        ragEnabled: false,
      };
    }
  } catch (error) {
    console.error("[RAG] Unexpected error in processWithRAG:", error.message);

    // On error, fall back to original prompt (graceful degradation)
    return {
      augmentedPrompt: prompt,
      retrievalResults: null,
      systemPromptAddendum: "",
      ragEnabled: false,
      error: error.message,
    };
  }
}

/**
 * Add a document to the RAG vector store
 *
 * This is called when users create flashcards, notes, etc.
 * It's an optional operation - the application works without it.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {'flashcard' | 'quiz' | 'note' | 'video'} params.sourceType - Document type
 * @param {string} params.sourceId - Unique ID of the document
 * @param {string} params.text - The text to embed
 * @param {Object} params.metadata - Additional context (optional)
 *
 * @returns {Object} { success, embeddingId, error }
 */
export async function addToVectorStore({
  userId,
  sourceType,
  sourceId,
  text,
  metadata = {},
}) {
  if (!userId || !sourceType || !sourceId || !text) {
    return {
      success: false,
      error: "Missing required fields: userId, sourceType, sourceId, text",
    };
  }

  try {
    // Embed the text
    const embedding = await embedText(text);

    // Store in vector DB
    const result = await storeEmbedding({
      userId,
      sourceType,
      sourceId,
      text,
      embedding,
      metadata,
    });

    return {
      success: true,
      embeddingId: result._id?.toString(),
    };
  } catch (error) {
    console.error("Failed to add to vector store:", error);

    // Don't fail the original operation if embedding fails
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Preview RAG results without augmenting the prompt
 * Useful for UI that shows what RAG would retrieve
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.query - The query string
 * @param {string[]} params.sources - Sources to search
 *
 * @returns {Object} Raw retrieval results grouped by source
 */
export async function previewRAGResults({
  userId,
  query,
  sources = ["flashcard", "quiz", "note"],
}) {
  if (!userId || !query) {
    throw new Error("Missing required fields: userId, query");
  }

  try {
    // Use the bySource retrieval for UI preview
    const results = await retrieveBySource({
      userId,
      query,
      topKPerSource: 3,
    });

    return {
      query,
      preview: results.bySource,
      total: Object.values(results.bySource).reduce(
        (sum, arr) => sum + arr.length,
        0,
      ),
    };
  } catch (error) {
    console.error("RAG preview error:", error);
    return {
      query,
      preview: {},
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Health check for RAG system
 * Verifies that embedding and vector store are working
 *
 * @param {string} userId - User ID to test with
 * @returns {Object} { healthy, message, details }
 */
export async function healthCheck(userId = "test_user") {
  const checks = {
    embedding: false,
    vectorStore: false,
    errors: [],
  };

  try {
    // Test embedding
    const testText = "This is a test";
    const embedding = await embedText(testText);
    checks.embedding = Array.isArray(embedding) && embedding.length > 0;
  } catch (error) {
    checks.errors.push(`Embedding failed: ${error.message}`);
  }

  try {
    // Test vector store
    if (checks.embedding) {
      const testEmbedding = await embedText("test");
      await storeEmbedding({
        userId,
        sourceType: "test",
        sourceId: "health_check",
        text: "Health check test",
        embedding: testEmbedding,
      });
      checks.vectorStore = true;
    }
  } catch (error) {
    checks.errors.push(`Vector store failed: ${error.message}`);
  }

  const healthy = checks.embedding && checks.vectorStore;

  return {
    healthy,
    message: healthy ? "RAG system is operational" : "RAG system has issues",
    details: checks,
  };
}
