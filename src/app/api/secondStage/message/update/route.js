// FILE: src/app/api/secondStage/message/update/route.js
// DESCRIPTION: API endpoint to update an existing message (e.g. patching interactive spec)
// RESPONSIBILITY: Handle POST requests to update message fields in MongoDB.

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { updateMessage } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/message/update
 *
 * Request body:
 *   {
 *     messageId: string (required),
 *     updates: {
 *       interactiveStatus?: string,
 *       interactiveSpec?: object,
 *       interactiveTitle?: string,
 *       content?: string
 *     }
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
        const { messageId, updates } = body;

        if (!messageId || !updates) {
            return NextResponse.json(
                { error: 'messageId and updates are required' },
                { status: 400 }
            );
        }

        const result = await updateMessage({
            userId: user.id,
            messageId,
            updates
        });

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Message not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message update API error:', error);
        return NextResponse.json(
            { error: 'Failed to update message', details: error.message },
            { status: 500 }
        );
    }
}
