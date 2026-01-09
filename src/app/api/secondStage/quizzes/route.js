// FILE: src/app/api/secondStage/quizzes/route.js
// DESCRIPTION: Quiz generation endpoint; generates multiple-choice questions from selected messages

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveQuizzes, getQuizzes } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/quizzes
 * 
 * Request body:
 *   {
 *     chatId: string,
 *     messageIds: string[],
 *     provider: string (optional, defaults to "openai"),
 *     apiKey: string (optional),
 *     questionCount: number (optional, default 5)
 *   }
 * 
 * Response:
 *   {
 *     questions: [
 *       {
 *         question: "What is X?",
 *         options: ["A", "B", "C", "D"],
 *         answerIndex: 0,
 *         explanation: "Because..."
 *       },
 *       ...
 *     ],
 *     chatId: string,
 *     messageCount: number,
 *     savedId: string (if authenticated)
 *   }
 * 
 * Data flow:
 *   1. Validate input
 *   2. Fetch messages from DB (placeholder)
 *   3. Call provider with JSON prompt requesting MCQs
 *   4. Parse JSON response, validate structure
 *   5. Save to DB (if authenticated)
 *   6. Return questions array
 */
export async function POST(req) {
  try {
    const {
      chatId,
      messageIds = [],
      provider = 'openai',
      apiKey,
      questionCount = 5,
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
      'You are an expert tutor. Generate multiple-choice questions in JSON array format. Each question: {question: "text", options: ["A", "B", "C", "D"], answerIndex: 0, explanation: "why A is correct"}. Respond ONLY with JSON array.';

    const userPrompt = `Generate ${questionCount} multiple-choice questions from this content:\n\n${placeholderMessages
      .map((msg) => msg.content)
      .join('\n\n')}\n\nReturn ONLY a JSON array of questions.`;

    // Call provider
    const quizzesResponse = await callProvider({
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
    let questions = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = quizzesResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(quizzesResponse);
      }

      // Validate question structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      questions = questions.filter(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          typeof q.answerIndex === 'number' &&
          q.explanation
      );
    } catch (parseError) {
      console.error('JSON parse error in quizzes:', parseError);
      return Response.json(
        { error: 'Failed to parse LLM response as JSON quiz array' },
        { status: 400 }
      );
    }

    // Save to DB if authenticated
    let savedId = null;
    if (user) {
      try {
        const result = await saveQuizzes({
          userId: user.id,
          chatId,
          messageIds,
          questions,
        });
        savedId = result._id?.toString();
      } catch (dbError) {
        console.error('Error saving quizzes to DB:', dbError);
      }
    }

    return Response.json({
      questions,
      chatId,
      messageCount: messageIds.length,
      savedId,
      provider,
    });
  } catch (error) {
    console.error('Quizzes API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/secondStage/quizzes
 * Retrieve quiz sets for a chat
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

    const sets = await getQuizzes({
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
    console.error('Quizzes GET error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
