// FILE: src/app/api/secondStage/new-chat/route.js
// DESCRIPTION: Create a new chat session

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { createNewChat } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/new-chat
 *
 * Creates a new chat session
 * "New Chat" means:
 *   - Generate a unique chatId
 *   - Create session document in MongoDB
 *   - Initialize with system message
 *   - Return chatId to frontend
 *
 * Request body:
 *   {} (empty or { title: string } optional)
 *
 * Response:
 *   {
 *     success: true,
 *     chatId: string,
 *     title: string,
 *     createdAt: timestamp
 *   }
 *
 * Important:
 *   - Does NOT reset or affect the LLM model
 *   - Old chats remain stored and untouched
 *   - Each chatId is a separate conversation context
 */
export async function POST(req) {
  try {
    // Get authenticated user (required for chat sessions)
    const user = await getUserIfAuthenticated(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create chat' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title = null } = body;

    // Create new chat session in MongoDB
    const newChat = await createNewChat({
      userId: user.id,
      title,
    });

    return NextResponse.json({
      success: true,
      chatId: newChat.chatId,
      title: newChat.title,
      createdAt: newChat.createdAt,
    });
  } catch (error) {
    console.error('New chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create new chat',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
