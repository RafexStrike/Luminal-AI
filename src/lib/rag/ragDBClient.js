// FILE: src/lib/rag/ragDBClient.js
// DESCRIPTION: Separate MongoDB client for ragDB (Revise From Context subsystem)
// PURPOSE: Provides isolated DB access for revise_sessions, revise_chat_history,
//          and optional metrics/exemplars collections. Does NOT touch LuminalDB.

import { MongoClient } from 'mongodb';

const RAG_DB_NAME = 'ragDB';

let ragClient = null;

/**
 * Get or create a singleton MongoClient for ragDB.
 * Reuses the SECONDARY_MONGODB_URI connection string but targets
 * the 'ragDB' database explicitly.
 */
async function getMongoClient() {
    const uri = process.env.SECONDARY_MONGODB_URI;
    if (!uri) {
        throw new Error('SECONDARY_MONGODB_URI environment variable not set');
    }

    if (ragClient && ragClient.topology?.isConnected()) {
        return ragClient;
    }

    ragClient = new MongoClient(uri);
    await ragClient.connect();
    return ragClient;
}

/**
 * Get the ragDB database handle.
 * All Revise subsystem collections live here.
 *
 * Collections:
 *   - revise_sessions       { sessionId, userId, categoryId, createdAt, name }
 *   - revise_chat_history   { sessionId, sender:'user'|'agent', text, timestamp, meta }
 *   - exemplars             { optional saved structured outputs }
 *   - metrics               { optional request/response logging }
 *
 * @returns {import('mongodb').Db}
 */
export async function getRagDB() {
    const client = await getMongoClient();
    return client.db(RAG_DB_NAME);
}
