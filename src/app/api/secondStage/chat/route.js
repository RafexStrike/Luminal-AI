// FILE: src/app/api/secondStage/chat/route.js
// DESCRIPTION: Chat endpoint; accepts messages and provider config, returns streamed or full response

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { updateChatMessages } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/chat
 * 
 * Request body:
 *   {
 *     provider: "openai" | "huggingface" | "groq",
 *     apiKey: string (optional, falls back to env var),
 *     messages: [ { role: "user"|"assistant", content: string }, ... ],
 *     stream: boolean (default: false),
 *     chatId: string (optional, for saving to DB)
 *   }
 * 
 * Response (non-streaming):
 *   {
 *     content: string,
 *     provider: string,
 *     chatId: string
 *   }
 * 
 * Response (streaming):
 *   ReadableStream with Server-Sent Events (SSE)
 * 
 * Data flow:
 *   - Validate auth (optional for anonymous)
 *   - Call callProvider adapter with messages
 *   - If stream=true, return ReadableStream
 *   - Otherwise return full response JSON
 *   - Save messages to DB if chatId provided (auth required)
 */
export async function POST(req) {
  try {
    const { provider, apiKey, messages, stream = false, chatId } = await req.json();

    // Validate input
    if (!provider || !messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Missing required fields: provider, messages' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional)
    const user = await getUserIfAuthenticated(req);

    // TODO: Get system prompt from user settings or request body
    const systemPrompt =
      'You are a concise, friendly tutor. Explain concepts clearly and provide examples when helpful.';

    // Call the LLM provider
    const providerResponse = await callProvider({
      provider,
      apiKey,
      messages,
      stream,
      systemPrompt,
    });

    if (stream) {
      // TODO: Stream response (currently returns full response, but framework is in place)
      // For now, return the streaming response as-is if provider supports it
      return providerResponse;
    }

    // Non-streaming response
    const content = typeof providerResponse === 'string' ? providerResponse : '';

    // Save messages to DB if user authenticated and chatId provided
    if (user && chatId) {
      try {
        const allMessages = [
          ...messages,
          { role: 'assistant', content },
        ];
        await updateChatMessages({
          userId: user.id,
          chatId,
          messages: allMessages,
        });
      } catch (dbError) {
        console.error('Error saving to DB:', dbError);
        // Don't fail the response if DB write fails
      }
    }

    return Response.json({
      content,
      provider,
      chatId: chatId || null,
      streaming: false,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/secondStage/chat
 * Retrieve chat history (optional)
 * Query params: chatId
 * Returns: { messages: [...] }
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

    // TODO: Fetch messages from DB
    // const user = await getUserIfAuthenticated(req);
    // const chat = await getChat({ userId: user?.id, chatId });

    return Response.json({
      messages: [],
      chatId,
    });
  } catch (error) {
    console.error('Chat GET API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
