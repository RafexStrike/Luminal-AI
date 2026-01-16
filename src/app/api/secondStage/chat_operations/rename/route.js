// FILE: src/app/api/secondStage/chat_operations/rename/route.js
// DESCRIPTION: Rename a chat session

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { updateChatTitle, getChat } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/chat_operations/rename
 *
 * Rename a chat session
 *
 * Request body:
 *   {
 *     chatId: string,
 *     title: string
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       _id: string,
 *       title: string,
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

    const { chatId, title } = await req.json();

    if (!chatId || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'chatId and non-empty title required' },
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

    await updateChatTitle({ userId: user.id, chatId, title: title.trim() });

    return NextResponse.json({
      success: true,
      data: {
        _id: chatId,
        title: title.trim(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Rename chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to rename chat', details: error.message },
      { status: 500 }
    );
  }
}
