// FILE: src/app/api/secondStage/message/save/route.js
// DESCRIPTION: API endpoint to save a single message to MongoDB
// RESPONSIBILITY: Handle POST requests to save a message without triggering LLM inference.

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveMessage } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/message/save
 *
 * Request body:
 *   {
 *     chatId: string (required),
 *     role: string (required),
 *     content: string (required),
 *     interactiveStatus?: string,
 *     interactiveTitle?: string,
 *     interactiveSpec?: object
 *   }
 */
export async function POST(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { chatId, role, content, interactiveStatus, interactiveTitle, interactiveSpec } = body;

        if (!chatId || !role || content === undefined) {
            return NextResponse.json(
                { error: 'chatId, role, and content are required' },
                { status: 400 }
            );
        }

        const messageDoc = await saveMessage({
            userId: user.id,
            chatId,
            role,
            content,
            interactiveStatus,
            interactiveTitle,
            interactiveSpec
        });

        return NextResponse.json({ success: true, messageId: messageDoc._id });
    } catch (error) {
        console.error('Message save API error:', error);
        return NextResponse.json(
            { error: 'Failed to save message', details: error.message },
            { status: 500 }
        );
    }
}
