// FILE: src/lib/rag/reviseController.js
// DESCRIPTION: Orchestrates the Revise From Context pipeline
// PURPOSE: retrieve chunks → build prompt → call LLM → return plain text answer

import { retrieve } from './reviseRetriever.js';
import { buildRevisePrompt } from './revisePromptBuilder.js';
import { getRagDB } from './ragDBClient.js';
import { callProvider } from '@/lib/SECONDARY_providers';

// ─── Main generation handler ────────────────────────────────────────

/**
 * Handle a Revise generation request.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.categoryId
 * @param {string} params.query
 * @param {number} [params.topK]
 * @returns {Promise<{ answer: string }>}
 */
export async function handleReviseGeneration({ userId, categoryId, query, topK }) {
    // ── Validate inputs ──
    if (!userId || !categoryId || !query) {
        throw new Error('Missing required fields: userId, categoryId, query');
    }

    // ── Step 1: Retrieve context ──
    const chunks = await retrieve(userId, categoryId, query, topK);

    if (chunks.length === 0) {
        return {
            answer: "I don't have enough study materials in this category to answer your question. Try chatting more in this category first, or select a different category.",
        };
    }

    // ── Step 2: Build prompt ──
    const { systemPrompt, userPrompt } = buildRevisePrompt({
        chunks,
        userQuery: query,
    });

    // ── Step 3: Call LLM ──
    let llmResponse;
    try {
        llmResponse = await callProvider({
            provider: 'huggingface',
            apiKey: null,
            messages: [{ role: 'user', content: userPrompt }],
            stream: false,
            systemPrompt,
        });
    } catch (err) {
        console.error('[ReviseController] LLM call failed:', err.message);
        throw new Error('LLM call failed: ' + err.message);
    }

    // ── Step 4: Return plain text ──
    return { answer: llmResponse || 'No response from the model.' };
}

// ─── Session management ─────────────────────────────────────────────

/**
 * Create a new Revise session for a user + category.
 */
export async function createSession({ userId, categoryId, name = 'New Revise Session' }) {
    if (!userId || !categoryId) throw new Error('userId and categoryId required');

    const db = await getRagDB();
    const collection = db.collection('revise_sessions');

    const { ObjectId } = await import('mongodb');
    const sessionId = new ObjectId().toString();

    const doc = {
        sessionId,
        userId,
        categoryId,
        name,
        createdAt: new Date(),
    };

    await collection.insertOne(doc);
    return doc;
}

/**
 * List all Revise sessions for a user + category.
 */
export async function listSessions({ userId, categoryId }) {
    if (!userId || !categoryId) throw new Error('userId and categoryId required');

    const db = await getRagDB();
    const collection = db.collection('revise_sessions');

    return collection
        .find({ userId, categoryId })
        .sort({ createdAt: -1 })
        .toArray();
}

/**
 * Get full chat history for a session.
 */
export async function getSessionHistory({ sessionId }) {
    if (!sessionId) throw new Error('sessionId required');

    const db = await getRagDB();
    const collection = db.collection('revise_chat_history');

    return collection
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray();
}

/**
 * Post a user message, generate agent reply, persist both.
 */
export async function handleSessionMessage({ sessionId, userId, categoryId, query, topK }) {
    if (!sessionId || !userId || !categoryId || !query) {
        throw new Error('sessionId, userId, categoryId, and query are required');
    }

    const db = await getRagDB();
    const historyCollection = db.collection('revise_chat_history');

    // 1. Persist user message
    const userMsg = {
        sessionId,
        sender: 'user',
        text: query,
        timestamp: new Date(),
    };
    await historyCollection.insertOne(userMsg);

    // 2. Generate agent reply
    const agentReply = await handleReviseGeneration({ userId, categoryId, query, topK });

    // 3. Persist agent reply
    const agentMsg = {
        sessionId,
        sender: 'agent',
        text: agentReply.answer,
        timestamp: new Date(),
    };
    await historyCollection.insertOne(agentMsg);

    return agentReply;
}
