// FILE: src/lib/tutoring/sessionManager.js
// DESCRIPTION: In-memory adaptive tutoring session store
// RESPONSIBILITY: Create, retrieve, patch, and terminate tutor sessions.
//
// Sessions are stored in a module-level Map and are ephemeral — they live
// as long as the Next.js server process.  This is intentional for v1; a
// persistent backend (e.g. MongoDB) can be swapped in by replacing the
// four exported functions without touching any callers.
//
// Session shape:
// {
//   sessionId: string,       — nanoid(12)
//   userId:    string,       — from auth
//   topic:     string,       — human-readable topic
//   mastery:   { [concept]: number },  — BKT probability per concept
//   ability:   number,       — IRT ability estimate
//   turn:      number,       — 0-indexed, incremented after each question
//   history:   TurnRecord[], — chronological record of all turns
//   createdAt: number,       — Date.now()
//   terminated: boolean,
// }
//
// TurnRecord shape:
// {
//   turn:          number,
//   question:      string,
//   hint:          string,
//   studentAnswer: string,
//   isCorrect:     boolean,
//   strategy:      string,
//   masteryBefore: number,
//   masteryAfter:  number,
//   abilityBefore: number,
//   abilityAfter:  number,
// }

import { nanoid } from 'nanoid';
import { BKT_PARAMS, initialMastery, averageMastery } from './bkt.js';

/** Max turns before auto-termination. */
export const MAX_TURNS = 10;

/** Mastery threshold for successful termination. */
export const MASTERY_THRESHOLD = 0.9;

// ── Private store ─────────────────────────────────────────────────────────────

/** @type {Map<string, Object>} */
const _sessions = new Map();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new tutoring session.
 *
 * @param {Object} params
 * @param {string} params.topic   — topic being tutored
 * @param {string} params.userId  — authenticated user ID
 * @param {string[]} [params.concepts] — optional known concepts to pre-populate mastery
 * @returns {Object} the new session
 */
export function createSession({ topic, userId, concepts = [] }) {
    const sessionId = nanoid(12);

    const mastery = {};
    for (const concept of concepts) {
        mastery[concept] = initialMastery(); // P_L0 = 0.2
    }
    // Always track the root topic itself
    if (!mastery[topic]) {
        mastery[topic] = initialMastery();
    }

    const session = {
        sessionId,
        userId,
        topic,
        mastery,
        ability: 0,          // IRT: mid-scale start
        turn: 0,
        history: [],
        createdAt: Date.now(),
        terminated: false,
    };

    _sessions.set(sessionId, session);
    console.log('TUTORING: session created', { sessionId, topic, userId });
    return session;
}

/**
 * Retrieve a session by ID.
 *
 * @param {string} sessionId
 * @returns {Object|null} session or null if not found
 */
export function getSession(sessionId) {
    return _sessions.get(sessionId) ?? null;
}

/**
 * Apply a partial update to a session.
 *
 * @param {string} sessionId
 * @param {Object} patch — plain object of fields to merge (shallow)
 * @returns {Object} updated session
 * @throws if session not found
 */
export function updateSession(sessionId, patch) {
    const session = _sessions.get(sessionId);
    if (!session) {
        throw new Error(`TUTORING: session not found — ${sessionId}`);
    }
    const updated = { ...session, ...patch };
    _sessions.set(sessionId, updated);
    return updated;
}

/**
 * Append a turn record to a session's history and increment the turn counter.
 *
 * @param {string} sessionId
 * @param {Object} turnRecord — TurnRecord shape (see file header)
 * @returns {Object} updated session
 */
export function appendTurn(sessionId, turnRecord) {
    const session = _sessions.get(sessionId);
    if (!session) {
        throw new Error(`TUTORING: session not found — ${sessionId}`);
    }
    const updated = {
        ...session,
        turn: session.turn + 1,
        history: [...session.history, { ...turnRecord, turn: session.turn }],
    };
    _sessions.set(sessionId, updated);
    return updated;
}

/**
 * Mark a session as terminated.
 *
 * @param {string} sessionId
 * @param {string} [reason] — optional reason for logging
 * @returns {void}
 */
export function terminateSession(sessionId, reason = 'unspecified') {
    const session = _sessions.get(sessionId);
    if (session) {
        _sessions.set(sessionId, { ...session, terminated: true });
        console.log('TUTORING: session terminated', { sessionId, reason });
    }
}

/**
 * Determine whether a session should be terminated.
 *
 * Termination conditions (any one triggers):
 *   1. Already marked terminated
 *   2. Average mastery across all concepts > MASTERY_THRESHOLD (0.9)
 *   3. turn > MAX_TURNS (10)
 *
 * @param {Object} session
 * @returns {{ shouldTerminate: boolean, reason: string|null }}
 */
export function checkTermination(session) {
    if (session.terminated) {
        return { shouldTerminate: true, reason: 'already_terminated' };
    }
    const avg = averageMastery(session.mastery);
    if (avg >= MASTERY_THRESHOLD) {
        return { shouldTerminate: true, reason: 'mastery_achieved' };
    }
    if (session.turn >= MAX_TURNS) {
        return { shouldTerminate: true, reason: 'max_turns_reached' };
    }
    return { shouldTerminate: false, reason: null };
}
