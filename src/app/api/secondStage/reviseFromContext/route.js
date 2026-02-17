// FILE: src/app/api/secondStage/reviseFromContext/route.js
// DESCRIPTION: POST /api/secondStage/reviseFromContext — generate endpoint
// PURPOSE: Accepts a Revise query and returns a grounded answer with sources

import { handleReviseGeneration } from '@/lib/rag/reviseController';
import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';

/**
 * POST /api/secondStage/reviseFromContext/generate
 *
 * Request body:
 * {
 *   userId: string,
 *   categoryId: string,
 *   mode: "QA"|"REVISION"|"QUIZ",
 *   sessionId?: string,
 *   query: string,
 *   topK?: number (default 6),
 *   difficulty?: "easy"|"medium"|"hard",
 *   includeUploads?: boolean (default true),
 *   strictMode?: boolean (default false)
 * }
 *
 * Response (OK):
 * { status:"OK", answer, explanation_steps, sources, context_strength, confidence }
 *
 * Response (INSUFFICIENT_CONTEXT):
 * { status:"INSUFFICIENT_CONTEXT", reason, suggestion }
 */
export async function POST(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        const body = await req.json();
        const {
            categoryId,
            mode = 'QA',
            query,
            topK = 6,
            difficulty = 'medium',
            includeUploads = true,
            strictMode = false,
            sessionId = null,
        } = body;

        if (!categoryId || !query) {
            return NextResponse.json(
                { error: 'Missing required fields: categoryId, query' },
                { status: 400 }
            );
        }

        const result = await handleReviseGeneration({
            userId: user.id,
            categoryId,
            mode,
            query,
            topK,
            difficulty,
            includeUploads,
            strictMode,
            sessionId,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[ReviseFromContext] Generate error:', error);
        return NextResponse.json(
            { error: 'Failed to generate revise response', details: error.message },
            { status: 500 }
        );
    }
}
