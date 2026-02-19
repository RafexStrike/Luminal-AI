// FILE: src/app/api/secondStage/chat-history/route.js
// DESCRIPTION: Retrieve full message history for a specific chat

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { getMessageHistory } from '@/lib/SECONDARY_db';

/**
 * GET /api/secondStage/chat-history
 *
 * Retrieve full message history for a specific chat session
 * Used when user clicks on a chat in sidebar to restore the conversation
 *
 * Query params:
 *   - chatId: string (required)
 *
 * Response:
 *   {
 *     success: true,
 *     chatId: string,
 *     messages: [
 *       {
 *         _id: string,
 *         role: "user" | "assistant" | "system",
 *         content: string,
 *         createdAt: timestamp,
 *         sequenceNumber: number
 *       },
 *       ...
 *     ]
 *   }
 *
 * Notes:
 *   - Messages include system message at sequenceNumber 0
 *   - Messages are ordered by sequenceNumber (oldest first)
 *   - Frontend may filter out system message for display
 *   - This is the "reload chat" endpoint: loading old conversations
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId query parameter' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserIfAuthenticated(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch full message history from MongoDB
    // This is the complete conversation context for this chatId
    const messages = await getMessageHistory({
      userId: user.id,
      chatId,
    });

    // Format messages for frontend
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id?.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      sequenceNumber: msg.sequenceNumber,
      // Include interactive fields
      interactiveStatus: msg.interactiveStatus,
      interactiveTitle: msg.interactiveTitle,
      interactiveSpec: msg.interactiveSpec,
    }));

    return NextResponse.json({
      success: true,
      chatId,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve chat history',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
