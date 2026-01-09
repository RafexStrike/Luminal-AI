// FILE: src/app/api/secondStage/flashcards/route.js
// DESCRIPTION: Flashcard generation endpoint; generates Q&A cards from selected messages

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveFlashcards, getFlashcards } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/flashcards
 * 
 * Request body:
 *   {
 *     chatId: string,
 *     messageIds: string[],
 *     provider: string (optional, defaults to "openai"),
 *     apiKey: string (optional)
 *   }
 * 
 * Response:
 *   {
 *     cards: [
 *       { q: "Question?", a: "Answer", difficulty: "easy|medium|hard", tags: ["tag1", "tag2"] },
 *       ...
 *     ],
 *     chatId: string,
 *     messageCount: number,
 *     savedId: string (if authenticated)
 *   }
 * 
 * Data flow:
 *   1. Validate input (chatId, messageIds)
 *   2. Fetch actual messages from DB (placeholder here)
 *   3. Call provider with JSON prompt requesting flashcard array
 *   4. Parse JSON response, validate structure
 *   5. Save to DB (if authenticated)
 *   6. Return cards array
 */
export async function POST(req) {
  try {
    const {
      chatId,
      messageIds = [],
      provider = 'openai',
      apiKey,
    } = await req.json();

    // Validate input
    if (!chatId || !messageIds || messageIds.length === 0) {
      return Response.json(
        { error: 'Missing required fields: chatId, messageIds' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserIfAuthenticated(req);

    // TODO: Fetch actual messages from DB using messageIds
    const placeholderMessages = messageIds.map((id) => ({
      role: 'assistant',
      content: `[Message ${id} content placeholder]`,
    }));

    const systemPrompt =
      'You are an expert tutor. Generate flashcards in JSON array format. Each card: {q: "question", a: "answer", difficulty: "easy|medium|hard", tags: ["tag1", "tag2"]}. Respond ONLY with JSON array, no markdown.';

    const userPrompt = `Generate 10 flashcards from this content:\n\n${placeholderMessages
      .map((msg) => msg.content)
      .join('\n\n')}\n\nReturn ONLY a JSON array.`;

    // Call provider
    const flashcardsResponse = await callProvider({
      provider,
      apiKey,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      stream: false,
      systemPrompt,
    });

    // Parse JSON response
    let cards = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = flashcardsResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
      } else {
        cards = JSON.parse(flashcardsResponse);
      }

      // Validate card structure
      if (!Array.isArray(cards)) {
        throw new Error('Response is not an array');
      }

      cards = cards.filter(
        (card) =>
          card.q && card.a && typeof card.q === 'string' && typeof card.a === 'string'
      );
    } catch (parseError) {
      console.error('JSON parse error in flashcards:', parseError);
      return Response.json(
        { error: 'Failed to parse LLM response as JSON flashcard array' },
        { status: 400 }
      );
    }

    // Save to DB if authenticated
    let savedId = null;
    if (user) {
      try {
        const result = await saveFlashcards({
          userId: user.id,
          chatId,
          messageIds,
          cards,
        });
        savedId = result._id?.toString();
      } catch (dbError) {
        console.error('Error saving flashcards to DB:', dbError);
      }
    }

    return Response.json({
      cards,
      chatId,
      messageCount: messageIds.length,
      savedId,
      provider,
    });
  } catch (error) {
    console.error('Flashcards API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/secondStage/flashcards
 * Retrieve flashcard sets for a chat
 * Query params: chatId
 * Returns: { sets: [...] }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return Response.json(
        { error: 'Missing chatId parameter' },
        { status: 400 }
      );
    }

    const user = await getUserIfAuthenticated(req);

    if (!user) {
      // Anonymous: return empty
      return Response.json({ sets: [] });
    }

    const sets = await getFlashcards({
      userId: user.id,
      chatId,
    });

    return Response.json({
      sets: sets.map((set) => ({
        ...set,
        _id: set._id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Flashcards GET error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
