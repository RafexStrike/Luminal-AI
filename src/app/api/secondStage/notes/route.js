// FILE: src/app/api/secondStage/notes/route.js
// DESCRIPTION: Notes endpoint; save and retrieve user notes

import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveNotes, getNotes } from '@/lib/SECONDARY_db';

/**
 * GET /api/secondStage/notes
 * 
 * Response:
 *   {
 *     content: string (markdown or plain text),
 *     createdAt: string (ISO),
 *     updatedAt: string (ISO)
 *   }
 * 
 * Data flow:
 *   - Authenticated user: fetch from DB
 *   - Anonymous: return empty notes object
 */
export async function GET(req) {
  try {
    const user = await getUserIfAuthenticated(req);

    if (!user) {
      // Anonymous: return empty
      return Response.json({
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const notes = await getNotes({ userId: user.id });
    return Response.json({
      content: notes.content || '',
      createdAt: notes.createdAt?.toISOString(),
      updatedAt: notes.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Notes GET error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/secondStage/notes
 * 
 * Request body:
 *   {
 *     content: string
 *   }
 * 
 * Response:
 *   {
 *     success: true,
 *     updatedAt: string (ISO)
 *   }
 * 
 * Behavior:
 *   - Requires authentication (returns 401 if not authenticated)
 *   - Saves/updates notes in MongoDB
 *   - Updates updatedAt timestamp
 */
export async function POST(req) {
  try {
    const { content } = await req.json();

    if (typeof content !== 'string') {
      return Response.json(
        { error: 'content must be a string' },
        { status: 400 }
      );
    }

    const user = await getUserIfAuthenticated(req);

    // Require authentication for saving
    if (!user) {
      return Response.json(
        { error: 'Authentication required to save notes' },
        { status: 401 }
      );
    }

    await saveNotes({
      userId: user.id,
      content,
    });

    return Response.json({
      success: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Notes POST error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
