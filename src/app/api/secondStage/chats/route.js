// FILE: src/app/api/secondStage/chats/route.js
// DESCRIPTION: Retrieve list of chat sessions for sidebar display

import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { getChatList } from '@/lib/SECONDARY_db';

/**
 * GET /api/secondStage/chats
 *
 * Retrieve all chat sessions for the authenticated user
 * Used to populate the sidebar "Recents" list
 *
 * Query params: (none)
 *
 * Response:
 *   {
 *     chats: [
 *       {
 *         _id: string (chatId),
 *         title: string,
 *         createdAt: timestamp,
 *         updatedAt: timestamp,
 *         messageCount: number
 *       },
 *       ...
 *     ]
 *   }
 *
 * Notes:
 *   - Chats are sorted by updatedAt (most recent first)
 *   - Data comes from MongoDB, NOT inferred from memory
 *   - Frontend can use _id as chatId to restore conversation
 */
export async function GET(req) {
  try {
    // Get authenticated user
    const user = await getUserIfAuthenticated(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all chats for this user, sorted by most recent
    const chats = await getChatList({
      userId: user.id,
    });

    return NextResponse.json({
      chats: chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messageCount: chat.messageCount || 0,
      })),
    });
  } catch (error) {
    console.error('Chat list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve chat list',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
