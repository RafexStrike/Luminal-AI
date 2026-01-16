// FILE: src/app/api/secondStage/chat_operations/set-collection/route.js
// DESCRIPTION: Move a chat to a collection

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { updateChatCollection, getChat } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/chat_operations/set-collection
 *
 * Move a chat to a collection
 *
 * Request body:
 *   {
 *     chatId: string,
 *     collection: string
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       _id: string,
 *       collection: string,
 *       updatedAt: timestamp
 *     }
 *   }
 */
export async function POST(req) {
  try {
    const user = await getUserIfAuthenticated(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { chatId, collection } = await req.json();

    if (!chatId || !collection || typeof collection !== 'string' || !collection.trim()) {
      return NextResponse.json(
        { success: false, error: 'chatId and non-empty collection required' },
        { status: 400 }
      );
    }

    // Verify chat ownership
    const chat = await getChat({ userId: user.id, chatId });
    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    await updateChatCollection({ userId: user.id, chatId, collection: collection.trim() });

    return NextResponse.json({
      success: true,
      data: {
        _id: chatId,
        collection: collection.trim(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Set collection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set collection', details: error.message },
      { status: 500 }
    );
  }
}
