// FILE: src/app/api/secondStage/chat_operations/delete/route.js
// DESCRIPTION: Delete (soft-delete) a chat session

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { deleteChat, getChat } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/chat_operations/delete
 *
 * Delete (soft-delete) a chat session
 *
 * Request body:
 *   {
 *     chatId: string
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       _id: string,
 *       deletedAt: timestamp
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

    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'chatId required' },
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

    await deleteChat({ userId: user.id, chatId });

    return NextResponse.json({
      success: true,
      data: {
        _id: chatId,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat', details: error.message },
      { status: 500 }
    );
  }
}
