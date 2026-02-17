// FILE: src/app/api/secondStage/reviseFromContext/sessions/[id]/message/route.js
// DESCRIPTION: POST a user message and get agent reply for a Revise session

import { handleSessionMessage } from '@/lib/rag/reviseController';
import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';

/**
 * POST /api/secondStage/reviseFromContext/sessions/:id/message
 *
 * Body: { categoryId, query }
 *
 * Returns: { answer: string }
 */
export async function POST(req, { params }) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        const { id: sessionId } = await params;
        const body = await req.json();

        const { categoryId, query } = body;

        if (!sessionId || !categoryId || !query) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, categoryId, query' },
                { status: 400 }
            );
        }

        const result = await handleSessionMessage({
            sessionId,
            userId: user.id,
            categoryId,
            query,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[ReviseMessage] Error:', error);
        return NextResponse.json(
            { error: 'Failed to process message', details: error.message },
            { status: 500 }
        );
    }
}
