// FILE: src/app/api/secondStage/reviseFromContext/sessions/route.js
// DESCRIPTION: GET/POST /api/secondStage/reviseFromContext/sessions
// PURPOSE: List and create Revise sessions per user+category

import { createSession, listSessions } from '@/lib/rag/reviseController';
import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';

/**
 * GET /api/secondStage/reviseFromContext/sessions?userId=&categoryId=
 * List all sessions for a user+category
 */
export async function GET(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId');

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Missing required query param: categoryId' },
                { status: 400 }
            );
        }

        const sessions = await listSessions({ userId: user.id, categoryId });
        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('[ReviseSessions] List error:', error);
        return NextResponse.json(
            { error: 'Failed to list sessions', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/secondStage/reviseFromContext/sessions
 * Create a new session
 * Body: { userId, categoryId, name? }
 */
export async function POST(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        const body = await req.json();
        const { categoryId, name } = body;

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Missing required field: categoryId' },
                { status: 400 }
            );
        }

        const session = await createSession({
            userId: user.id,
            categoryId,
            name: name || 'New Revise Session',
        });

        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error('[ReviseSessions] Create error:', error);
        return NextResponse.json(
            { error: 'Failed to create session', details: error.message },
            { status: 500 }
        );
    }
}
