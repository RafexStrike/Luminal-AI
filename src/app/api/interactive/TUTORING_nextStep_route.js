// FILE: src/app/api/interactive/TUTORING_nextStep_route.js
// DESCRIPTION: Core handler for POST /api/interactive/nextStep
// RESPONSIBILITY: Orchestrate the adaptive tutoring loop per request.
//
// Flow per request:
//   1. Auth
//   2. Parse & validate body
//   3. Load session
//   4. Evaluate student answer (LLM)
//   5. BKT mastery update
//   6. IRT ability update
//   7. Check termination conditions
//   8. Select strategy
//   9. Fetch RAG context
//  10. Generate next question (LLM)
//  11. Append turn to session history
//  12. Return response

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { fetchRAGSnippets } from '@/lib/interactive/INTERACTIVE_ragHelper';
import { updateMastery, averageMastery } from '@/lib/tutoring/bkt';
import { updateAbility, masteryToDifficulty } from '@/lib/tutoring/irt';
import { selectStrategy } from '@/lib/tutoring/strategyPolicy';
import {
    getSession,
    updateSession,
    appendTurn,
    checkTermination,
    terminateSession,
} from '@/lib/tutoring/sessionManager';
import {
    evaluateAnswer,
    generateNextQuestion,
} from '@/lib/tutoring/questionGenerator';

/**
 * POST /api/interactive/nextStep
 *
 * Request body:
 *   {
 *     sessionId:     string  — required
 *     studentAnswer: string  — required (may be empty string for first turn)
 *   }
 *
 * Response 200:
 *   {
 *     nextQuestion:   string,
 *     hint:           string,
 *     strategy:       string,
 *     updatedMastery: number,   — average mastery after update
 *     turn:           number,   — current turn index
 *     terminated:     boolean,
 *     terminationReason: string|null
 *   }
 *
 * Response 400: invalid input
 * Response 401: unauthenticated
 * Response 404: session not found
 * Response 500: internal error
 */
export async function POST(req) {
    console.log('TUTORING: nextStep request received');

    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const user = await getUserIfAuthenticated(req);
    if (!user) {
        console.warn('TUTORING: unauthenticated request rejected');
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Authentication required' } },
            { status: 401 }
        );
    }

    // ── 2. Parse body ────────────────────────────────────────────────────────
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Invalid JSON body' } },
            { status: 400 }
        );
    }

    const { sessionId, studentAnswer } = body;

    if (!sessionId || typeof sessionId !== 'string') {
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Missing required field: sessionId' } },
            { status: 400 }
        );
    }
    if (typeof studentAnswer !== 'string') {
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Missing required field: studentAnswer (may be empty string)' } },
            { status: 400 }
        );
    }

    // ── 3. Load session ──────────────────────────────────────────────────────
    let session = getSession(sessionId);
    if (!session) {
        console.error('TUTORING: session not found', { sessionId });
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Session not found', sessionId } },
            { status: 404 }
        );
    }

    // ── Guard: already terminated ────────────────────────────────────────────
    if (session.terminated) {
        return NextResponse.json({
            nextQuestion: null,
            hint: null,
            strategy: null,
            updatedMastery: averageMastery(session.mastery),
            turn: session.turn,
            terminated: true,
            terminationReason: 'already_terminated',
        });
    }

    // ── 4. Evaluate answer (skip on turn 0 — opening question, no prior answer) ──
    let isCorrect = false;
    const isFirstTurn = session.turn === 0 && !studentAnswer.trim();

    if (!isFirstTurn && studentAnswer.trim()) {
        const lastTurn = session.history[session.history.length - 1];
        const questionAsked = lastTurn?.question ?? session.topic;

        isCorrect = await evaluateAnswer({
            topic: session.topic,
            question: questionAsked,
            studentAnswer: studentAnswer.trim(),
        });
    }

    // ── 5. BKT mastery update ────────────────────────────────────────────────
    let updatedMastery = { ...session.mastery };

    if (!isFirstTurn) {
        // Update all tracked concepts equally on this response
        for (const concept of Object.keys(updatedMastery)) {
            updatedMastery[concept] = updateMastery(updatedMastery[concept], isCorrect);
        }
    }

    const masteryBefore = averageMastery(session.mastery);
    const masteryAfter = averageMastery(updatedMastery);

    // ── 6. IRT ability update ─────────────────────────────────────────────────
    const abilityBefore = session.ability;
    const difficulty = masteryToDifficulty(masteryBefore);
    const abilityAfter = isFirstTurn
        ? session.ability
        : updateAbility(session.ability, isCorrect, difficulty);

    // Persist mastery + ability to session
    session = updateSession(sessionId, {
        mastery: updatedMastery,
        ability: abilityAfter,
    });

    // ── 7. Check termination ──────────────────────────────────────────────────
    // Also check for explanation request in answer
    const requestedExplanation = /\b(explain|tell me|show me|i give up|i don'?t know)\b/i.test(studentAnswer);

    let { shouldTerminate, reason } = checkTermination(session);
    if (requestedExplanation) {
        shouldTerminate = true;
        reason = 'student_requested_explanation';
    }

    if (shouldTerminate) {
        terminateSession(sessionId, reason);
        return NextResponse.json({
            nextQuestion: null,
            hint: null,
            strategy: null,
            updatedMastery: masteryAfter,
            turn: session.turn,
            terminated: true,
            terminationReason: reason,
        });
    }

    // ── 8. Select strategy ────────────────────────────────────────────────────
    const strategy = selectStrategy(masteryAfter);

    // ── 9. Fetch RAG context ──────────────────────────────────────────────────
    let kbSnippets = '';
    try {
        kbSnippets = await fetchRAGSnippets({ userId: user.id, query: session.topic });
    } catch (err) {
        console.warn('TUTORING: RAG fetch failed — continuing without context', err);
    }

    // ── 10. Generate next question ────────────────────────────────────────────
    let generated;
    try {
        generated = await generateNextQuestion({ session, strategy, kbSnippets });
    } catch (err) {
        console.error('TUTORING ERROR: question generation threw', err);
        return NextResponse.json(
            {
                kind: 'error',
                payload: {
                    message: 'Question generation failed',
                    details: [err.message],
                },
            },
            { status: 500 }
        );
    }

    // ── 11. Append turn record ────────────────────────────────────────────────
    const turnRecord = {
        question: generated.nextQuestion,
        hint: generated.hint,
        studentAnswer: studentAnswer,
        isCorrect,
        strategy,
        masteryBefore,
        masteryAfter,
        abilityBefore,
        abilityAfter,
    };
    session = appendTurn(sessionId, turnRecord);

    // ── 12. Return response ───────────────────────────────────────────────────
    console.log('TUTORING: nextStep complete', {
        sessionId,
        turn: session.turn,
        strategy,
        mastery: masteryAfter.toFixed(3),
        correct: isCorrect,
    });

    return NextResponse.json({
        nextQuestion: generated.nextQuestion,
        hint: generated.hint,
        strategy,
        updatedMastery: masteryAfter,
        turn: session.turn,
        terminated: false,
        terminationReason: null,
    });
}
