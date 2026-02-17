// FILE: src/lib/rag/reviseRetriever.js
// DESCRIPTION: Retrieves relevant chunks from the vector store for a user + category
// PURPOSE: Embed the query, fetch all docs for the category, rank by cosine similarity

import { embedText } from './embedder.js';
import { SIMILARITY_THRESHOLD, DEFAULT_TOP_K } from './rag.constants.js';
import { MongoClient } from 'mongodb';

let _client = null;

async function getVectorStoreClient() {
    const uri = process.env.SECONDARY_MONGODB_URI;
    if (!uri) throw new Error('SECONDARY_MONGODB_URI not set');

    if (_client && _client.topology?.isConnected()) return _client;
    _client = new MongoClient(uri);
    await _client.connect();
    return _client;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) throw new Error('Vectors must have the same dimension');
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

/**
 * Retrieve relevant chunks for a user + category.
 *
 * @param {string} userId
 * @param {string} categoryId
 * @param {string} query
 * @param {number} [topK]
 * @returns {Promise<Array<{text: string, similarity: number}>>}
 */
export async function retrieve(userId, categoryId, query, topK = DEFAULT_TOP_K) {
    if (!userId || !categoryId || !query) {
        throw new Error('Missing required fields: userId, categoryId, query');
    }

    // Step 1: Embed the query
    let queryEmbedding;
    try {
        queryEmbedding = await embedText(query);
    } catch (err) {
        console.warn('[ReviseRetriever] Embedding failed:', err.message);
        return [];
    }

    // Step 2: Fetch ALL documents for this user + category (no sourceType filter)
    const client = await getVectorStoreClient();
    const db = client.db();
    const collection = db.collection('rag_embeddings');

    const filter = {
        userId: userId,
        'metadata.category': categoryId,
    };

    let documents;
    try {
        documents = await collection.find(filter).toArray();
        console.log('[ReviseRetriever] Fetched', documents.length, 'docs for user', userId, 'category', categoryId);
    } catch (err) {
        console.error('[ReviseRetriever] Vector search failed:', err.message);
        return [];
    }

    if (documents.length === 0) return [];

    // Step 3: Score and rank by cosine similarity
    const scored = documents.map((doc) => {
        try {
            const sim = cosineSimilarity(queryEmbedding, doc.embedding);
            return { text: doc.text, similarity: sim };
        } catch {
            return null;
        }
    }).filter(Boolean);

    // Step 4: Filter by threshold and sort
    const filtered = scored
        .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

    console.log('[ReviseRetriever] After threshold filtering:', filtered.length, 'chunks');

    return filtered.slice(0, topK);
}
