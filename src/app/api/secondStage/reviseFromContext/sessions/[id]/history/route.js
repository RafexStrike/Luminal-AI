// FILE: src/app/api/secondStage/reviseFromContext/sessions/[id]/history/route.js
// DESCRIPTION: GET session chat history
// PURPOSE: Returns the full message history for a Revise session

import { getSessionHistory } from '@/lib/rag/reviseController';
import { NextResponse } from 'next/server';

/**
 * GET /api/secondStage/reviseFromContext/sessions/:id/history
 */
export async function GET(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing session id' },
                { status: 400 }
            );
        }

        const history = await getSessionHistory({ sessionId: id });

        return NextResponse.json({
            sessionId: id,
            messages: history.map((msg) => ({
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp,
                meta: msg.meta || {},
            })),
        });
    } catch (error) {
        console.error('[ReviseHistory] Error:', error);
        return NextResponse.json(
            { error: 'Failed to get session history', details: error.message },
            { status: 500 }
        );
    }
}
