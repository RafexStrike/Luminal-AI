// FILE: src/app/api/secondStage/notes/route.js
// DESCRIPTION: Notes endpoint; save and retrieve user notes

import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveNotes, getNotes } from '@/lib/SECONDARY_db';

/**
 * GET /api/secondStage/notes
 * 
 * Query params: chatId (optional) - if provided, returns notes associated with that chat
 * 
 * Response:
 *   {
 *     content: string (HTML formatted by Tiptap),
 *     createdAt: string (ISO),
 *     updatedAt: string (ISO)
 *   }
 * 
 * Data flow:
 *   - Authenticated user: fetch from DB (filtered by chatId if provided)
 *   - Anonymous: return empty notes object
 *   - Content is stored as HTML (Tiptap format)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    
    const user = await getUserIfAuthenticated(req);

    if (!user) {
      // Anonymous: return empty
      return Response.json({
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const notes = await getNotes({ userId: user.id, chatId });
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
 *     content: string (HTML formatted by Tiptap),
 *     chatId: string (optional - associates note with specific chat)
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
 *   - Saves/updates notes in MongoDB with HTML format
 *   - Associates with chatId if provided
 *   - Updates updatedAt timestamp
 *   - Content is HTML from Tiptap editor, supports rich formatting
 */
export async function POST(req) {
  try {
    const { content, chatId } = await req.json();

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
      chatId,
    });

    // Background: add notes content to vector store (non-blocking)
    try {
      const { addToVectorStore } = await import('@/lib/rag/index.js');
      // Strip basic HTML tags for embedding
      const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const sourceId = `notes:${user.id}:${chatId || 'global'}`;

      addToVectorStore({
        userId: user.id,
        sourceType: 'note',
        sourceId,
        text: plain,
        metadata: { chatId: chatId || null },
      }).then((res) => {
        if (!res.success) {
          console.warn('addToVectorStore failed for notes', sourceId, res.error);
        } else {
          console.log('addToVectorStore succeeded for notes', sourceId);
        }
      }).catch((err) => {
        console.warn('addToVectorStore error for notes', sourceId, err?.message || err);
      });
    } catch (err) {
      console.warn('Failed to enqueue note embedding:', err?.message || err);
    }

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
