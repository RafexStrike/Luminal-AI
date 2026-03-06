// FILE: src/app/api/interactive/INTERACTIVE_route.js
// DESCRIPTION: Next.js API route — POST /api/interactive/generate
// RESPONSIBILITY: Parse request, auth, delegate to generator, return JSON.

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { generateInteractive } from '@/lib/interactive/INTERACTIVE_generator';
import { createSession } from '@/lib/tutoring/sessionManager';
import { initialMastery } from '@/lib/tutoring/bkt';

/**
 * POST /api/interactive/generate
 *
 * Request body:
 *   {
 *     query: string  — required, the user's query (may include "@interactive")
 *     title: string  — required, human-readable title for the explainer
 *     mode: string   — optional, "spec" (default) | "bundle"
 *   }
 *
 * Response:
 *   HTTP 200 — { kind: "spec"|"bundle", payload: {...} }
 *   HTTP 400 — { kind: "error", payload: { message, details, debugHint } }
 *   HTTP 401 — { kind: "error", payload: { message: "Authentication required" } }
 *   HTTP 500 — { kind: "error", payload: { message, details, debugHint } }
 */
export async function POST(req) {
    console.log('INTERACTIVE: request received', { method: 'POST', url: req.url });

    // ── Auth ────────────────────────────────────────────────────────────────
    const user = await getUserIfAuthenticated(req);
    if (!user) {
        console.warn('INTERACTIVE: unauthenticated request rejected');
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Authentication required', details: [], debugHint: '' } },
            { status: 401 }
        );
    }

    console.log('INTERACTIVE: authenticated user', { userId: user.id });

    // ── Parse body ──────────────────────────────────────────────────────────
    let body;
    try {
        body = await req.json();
    } catch (parseErr) {
        console.error('INTERACTIVE ERROR: failed to parse request body', parseErr);
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Invalid JSON body', details: [parseErr.message], debugHint: '' } },
            { status: 400 }
        );
    }

    const { query, title, mode = 'spec' } = body;

    // ── Validate inputs ─────────────────────────────────────────────────────
    if (!query || typeof query !== 'string' || !query.trim()) {
        console.error('INTERACTIVE ERROR: validation failed — missing query');
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Missing required field: query', details: ['query must be a non-empty string'], debugHint: '' } },
            { status: 400 }
        );
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
        console.error('INTERACTIVE ERROR: validation failed — missing title');
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Missing required field: title', details: ['title must be a non-empty string'], debugHint: '' } },
            { status: 400 }
        );
    }

    if (!['spec', 'bundle'].includes(mode)) {
        console.error('INTERACTIVE ERROR: validation failed — invalid mode', { mode });
        return NextResponse.json(
            { kind: 'error', payload: { message: 'Invalid mode', details: ['mode must be "spec" or "bundle"'], debugHint: '' } },
            { status: 400 }
        );
    }

    // ── Delegate to generator ───────────────────────────────────────────────
    console.log('INTERACTIVE: calling generator', { query: query.slice(0, 80), title, mode, userId: user.id });

    let result;
    try {
        result = await generateInteractive({
            query: query.trim(),
            title: title.trim(),
            mode,
            userId: user.id,
        });
    } catch (genErr) {
        console.error('INTERACTIVE ERROR: generator threw uncaught error', genErr);
        return NextResponse.json(
            {
                kind: 'error',
                payload: {
                    message: 'Internal generation error',
                    details: [genErr.message],
                    debugHint: 'INTERACTIVE: generator threw — see server logs for stack trace',
                },
            },
            { status: 500 }
        );
    }

    // ── Return result ────────────────────────────────────────────────────────
    if (result.kind === 'error') {
        console.error('INTERACTIVE ERROR: validation failed', result.payload);
        return NextResponse.json(result, { status: 400 });
    }

    console.log('INTERACTIVE: returning valid spec', { kind: result.kind });

    // ── Create Tutoring Session ──────────────────────────────────────────────
    // We create an ephemeral in-memory session for the adaptive loop.
    // The topic is taken from the generated spec.
    const session = createSession({
        topic: result.payload.topic || title,
        userId: user.id
    });

    // Attach sessionId and initial metadata to payload
    const finalResult = {
        ...result,
        payload: {
            ...result.payload,
            sessionId: session.sessionId,
            initialMastery: initialMastery(),
        }
    };

    return NextResponse.json(finalResult, { status: 200 });
}
