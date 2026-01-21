// FILE: src/lib/rag/vectorStore.js
// DESCRIPTION: MongoDB-backed vector store abstraction for semantic retrieval
// PURPOSE: Provides a reusable interface for storing and querying document embeddings
// 
// This is a NON-BREAKING addition. It:
// - Does NOT modify existing MongoDB collections
// - Does NOT replace the source-of-truth database
// - Is used ONLY for semantic similarity search when RAG is explicitly activated
// - Can be completely disabled by not calling the retrieval functions

import { MongoClient } from 'mongodb';

let mongoClient = null;

async function getMongoClient() {
  const uri = process.env.SECONDARY_MONGODB_URI;

  if (!uri) {
    throw new Error('SECONDARY_MONGODB_URI environment variable not set');
  }

  if (mongoClient && mongoClient.topology?.isConnected()) {
    return mongoClient;
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  return mongoClient;
}

/**
 * Store an embedding in the vector store
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for multi-tenancy
 * @param {string} params.sourceType - Type of source: "flashcard" | "quiz" | "note" | "video"
 * @param {string} params.sourceId - Reference to the original document
 * @param {string} params.text - The text that was embedded
 * @param {number[]} params.embedding - The embedding vector from HuggingFace
 * @param {Object} params.metadata - Additional context (optional)
 *
 * @returns {Object} The stored document with MongoDB _id
 */
export async function storeEmbedding({
  userId,
  sourceType,
  sourceId,
  text,
  embedding,
  metadata = {},
}) {
  if (!userId || !sourceType || !sourceId || !text || !embedding) {
    throw new Error(
      'Missing required fields: userId, sourceType, sourceId, text, embedding'
    );
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('rag_embeddings');

  // Ensure embedding index exists for vector similarity search
  // Note: This is a basic euclidean distance approach
  // MongoDB Atlas Search would provide better performance for large-scale RAG
  await collection.createIndex({ userId: 1, sourceType: 1 });

  const doc = {
    userId,
    sourceType,
    sourceId,
    text,
    embedding, // Store as array of numbers
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * Retrieve embeddings similar to the query embedding
 * Uses euclidean distance for vector similarity
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for multi-tenancy
 * @param {number[]} params.queryEmbedding - The query vector to search for
 * @param {string[]} params.sourceTypes - Filter by source types (optional)
 * @param {number} params.topK - Number of results to return (default: 5)
 * @param {number} params.threshold - Similarity threshold (0-1, optional)
 *
 * @returns {Array} Array of similar documents, sorted by similarity (descending)
 */
export async function retrieveSimilar({
  userId,
  queryEmbedding,
  sourceTypes = [],
  topK = 5,
  threshold = null,
}) {
  if (!userId || !queryEmbedding || !Array.isArray(queryEmbedding)) {
    throw new Error('Missing required fields: userId, queryEmbedding (array)');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('rag_embeddings');

  // Build query filter
  const filter = { userId };
  if (sourceTypes.length > 0) {
    filter.sourceType = { $in: sourceTypes };
  }

  // Fetch all documents for this user (TODO: optimize with MongoDB Atlas Search)
  const documents = await collection.find(filter).toArray();
  console.log('[RAG] retrieveSimilar: fetched', documents.length, 'documents for filter', filter);

  if (documents.length === 0) {
    return [];
  }

  // Calculate cosine similarity for each document
  const scored = documents.map((doc) => {
    try {
      const sim = cosineSimilarity(queryEmbedding, doc.embedding);
      return { ...doc, similarity: sim };
    } catch (err) {
      console.warn('[RAG] Skipping doc due to vector error:', err.message, 'docId:', doc._id?.toString());
      return { ...doc, similarity: -1 };
    }
  });

  // Sort by similarity (descending)
  let results = scored.sort((a, b) => b.similarity - a.similarity);

  // Log top similarities before thresholding
  const topSims = results.slice(0, Math.min(5, results.length)).map((r) => r.similarity);
  console.log('[RAG] Top similarities:', topSims);

  if (threshold !== null) {
    results = results.filter((r) => r.similarity >= threshold);
    console.log('[RAG] Results after applying threshold', threshold, '=>', results.length);
  }

  const final = results.slice(0, topK);
  console.log('[RAG] Returning', final.length, 'results (topK', topK, ')');
  return final;
}

/**
 * Calculate cosine similarity between two vectors
 * Range: [-1, 1], where 1 is identical
 *
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Delete embeddings for a specific document
 * Used when a flashcard, note, or quiz is deleted
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.sourceType - Source type to delete
 * @param {string} params.sourceId - Source ID to delete
 *
 * @returns {number} Number of documents deleted
 */
export async function deleteEmbedding({ userId, sourceType, sourceId }) {
  if (!userId || !sourceType || !sourceId) {
    throw new Error('Missing required fields: userId, sourceType, sourceId');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('rag_embeddings');

  const result = await collection.deleteMany({
    userId,
    sourceType,
    sourceId,
  });

  return result.deletedCount;
}

/**
 * List all embeddings for a user (for debugging or UI previews)
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string[]} params.sourceTypes - Filter by source types (optional)
 * @param {number} params.limit - Maximum results (default: 50)
 *
 * @returns {Array} Array of embedding documents
 */
export async function listEmbeddings({
  userId,
  sourceTypes = [],
  limit = 50,
}) {
  if (!userId) {
    throw new Error('Missing required field: userId');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('rag_embeddings');

  const filter = { userId };
  if (sourceTypes.length > 0) {
    filter.sourceType = { $in: sourceTypes };
  }

  return await collection
    .find(filter)
    .project({ embedding: 0 }) // Don't return raw embeddings
    .limit(limit)
    .toArray();
}

/**
 * Clear all embeddings for a user (for testing or reset)
 *
 * @param {string} userId - User ID
 * @returns {number} Number of documents deleted
 */
export async function clearUserEmbeddings(userId) {
  if (!userId) {
    throw new Error('Missing required field: userId');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('rag_embeddings');

  const result = await collection.deleteMany({ userId });
  return result.deletedCount;
}
