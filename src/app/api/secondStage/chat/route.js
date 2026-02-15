// FILE: src/app/api/secondStage/chat/route.js
// DESCRIPTION: Context-aware chat endpoint using MongoDB for session history
// HuggingFace Inference API provides stateless LLM responses
// 
// RAG INTEGRATION (NON-BREAKING):
// This endpoint optionally supports RAG metadata to augment prompts.
// If RAG metadata is not provided, behavior is identical to before.
// See: src/lib/rag/README.md for detailed documentation

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import {
  getMessageHistory,
  saveMessage,
  updateChatTitle,
  generateChatTitle,
} from '@/lib/SECONDARY_db';
import { processWithRAG } from '@/lib/rag/index.js';
import { NextResponse } from 'next/server';

/**
 * POST /api/secondStage/chat
 *
 * Request body:
 *   {
 *     chatId: string (required),
 *     prompt: string (the user's new message),
 *     provider: string (default: "huggingface"),
 *     stream: boolean (default: false),
 *     systemPrompt: string (optional, custom system instructions),
 *     rag: object (optional, RAG configuration - see RAG section below)
 *   }
 *
 * RAG Configuration (optional):
 *   {
 *     rag: {
 *       sources: string[] (e.g., ["flashcard", "note"])
 *     }
 *   }
 *   If not provided or empty, RAG is skipped entirely (unchanged behavior)
 *
 * Flow:
 *   1. Load all messages for chatId from MongoDB (this is the context)
 *   2. Append user's new message
 *   3. Send full message array to LLM provider
 *   4. Stream or buffer the response
 *   5. Save assistant's response to MongoDB
 *   6. If first user message, generate and save chat title
 *
 * Response (non-streaming):
 *   {
 *     content: string (assistant's response),
 *     chatId: string,
 *     messageCount: number,
 *     provider: string
 *   }
 *
 *
 * Flow (WITH RAG):
 *   1. Load message history
 *   2. (NEW) If RAG metadata provided: retrieve context and augment prompt
 *   3. Append user's (possibly augmented) message
 *   4. Send full message array to LLM provider
 *   5. Stream or buffer the response
 *   6. Save assistant's response to MongoDB
 *   7. If first user message, generate and save chat title
 *
 * Response (non-streaming):
 *   {
 *     content: string (assistant's response),
 *     chatId: string,
 *     messageCount: number,
 *     provider: string,
 *     rag: object (if RAG was used, includes contextRetrieved count)
 *   }
 *
 * Response (streaming):
 *   Server-Sent Events (SSE) with chunks
 */
export async function POST(req) {
  let user = null;

  try {
    const body = await req.json();
    const {
      chatId,
      prompt,
      provider = 'huggingface',
      stream = false,
      systemPrompt = null,
      rag = null,
    } = body;

    // Validate input
    if (!chatId || !prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId, prompt' },
        { status: 400 }
      );
    }

    // Get authenticated user (required for message persistence)
    user = await getUserIfAuthenticated(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required for chat sessions' },
        { status: 401 }
      );
    }

    // ============================================
    // STEP 1: Load message history from MongoDB
    // ============================================
    // This replaces the "in-memory conversationHistory" array
    // Context awareness comes from sending the full history to the LLM
    const messageHistory = await getMessageHistory({
      userId: user.id,
      chatId,
    });

    // Filter out system message (LLM provider will add its own)
    const contextMessages = messageHistory
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // ============================================
    // STEP 2: (OPTIONAL) Process RAG if enabled
    // ============================================
    let ragResult = null;
    let userPromptToSend = prompt.trim();

    if (rag && rag.sources && rag.sources.length > 0) {
      try {
        ragResult = await processWithRAG({
          userId: user.id,
          prompt: prompt.trim(),
          ragConfig: {
            sources: rag.sources,
            topK: rag.topK || 5,
            threshold: rag.threshold || 0.3,
          },
        });

        // Use augmented prompt if RAG succeeded
        if (ragResult.ragEnabled && ragResult.augmentedPrompt) {
          userPromptToSend = ragResult.augmentedPrompt;
        }
      } catch (error) {
        // Log RAG error but don't fail the chat request
        console.warn('RAG processing warning (non-fatal):', error.message);
        // Continue with original prompt
      }
    }

    // ============================================
    // STEP 3: Append new user message
    // ============================================
    const userMessage = {
      role: 'user',
      content: userPromptToSend,
    };

    const messagesToSend = [...contextMessages, userMessage];

    // ============================================
    // STEP 4: Save user message to DB
    // ============================================
    // NOTE: Save the ORIGINAL prompt (not augmented) for audit trail
    const userMsgDoc = await saveMessage({
      userId: user.id,
      chatId,
      role: 'user',
      content: prompt.trim(),
    });

    // ============================================
    // STEP 5: Check if this is the first user message
    // ============================================
    const isFirstMessage = messageHistory.length === 1; // Only system message exists
    if (isFirstMessage) {
      const title = generateChatTitle(prompt);
      await updateChatTitle({
        userId: user.id,
        chatId,
        title,
      });
    }

    // ============================================
    // STEP 6: Call LLM provider
    // ============================================
    const customSystemPrompt =
      systemPrompt ||
      'You are a helpful tutor. Explain concepts clearly and provide examples when helpful.';

    const providerResponse = await callProvider({
      provider,
      apiKey: null, // Uses environment variable
      messages: messagesToSend,
      stream,
      systemPrompt: customSystemPrompt,
    });

    // ============================================
    // STEP 7: Handle streaming vs non-streaming
    // ============================================
    if (stream) {
      // For streaming, we return SSE format
      return handleStreamingResponse(providerResponse, user, chatId, ragResult);
    }

    // Non-streaming: collect full response
    const assistantContent = providerResponse || '';

    const assistantMsgDoc = await saveMessage({
      userId: user.id,
      chatId,
      role: 'assistant',
      content: assistantContent,
    });

    // ============================================
    // STEP 8.5: Trigger Auto-Summary Check
    // ============================================
    try {
      const { checkAndGenerateAutoSummary } = await import('@/lib/autoSummaryWatcher');
      await checkAndGenerateAutoSummary({
        userId: user.id,
        chatId,
        currentSequenceNumber: assistantMsgDoc.sequenceNumber
      });
    } catch (err) {
      console.error('Auto-summary check failed:', err);
    }

    // ============================================
    // STEP 9: Return response
    // ============================================
    const finalMessageHistory = await getMessageHistory({
      userId: user.id,
      chatId,
    });

    const response = {
      content: assistantContent,
      chatId,
      messageCount: finalMessageHistory.length,
      provider,
      streaming: false,
    };

    // Include RAG metadata and retrieved results if it was used
    if (ragResult?.ragEnabled) {
      response.rag = {
        enabled: true,
        contextRetrieved: ragResult.contextRetrieved || 0,
        results: ragResult.retrievalResults?.results || [],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming response from HuggingFace
 * Converts iterator chunks into SSE format
 */
async function handleStreamingResponse(providerResponse, user, chatId, ragResult) {
  if (!providerResponse?.stream || !providerResponse?.iterator) {
    return NextResponse.json(
      { error: 'Streaming not available from provider' },
      { status: 500 }
    );
  }

  const { iterator } = providerResponse;
  let fullContent = '';

  const encoder = new TextEncoder();

  // Create a ReadableStream for SSE
  const customStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of iterator) {
          if (chunk.choices && chunk.choices[0]) {
            const delta = chunk.choices[0].delta?.content || '';
            fullContent += delta;

            // Send SSE format
            const message = `data: ${JSON.stringify({ content: delta })}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        }

        // After streaming is complete, save to DB
        const assistantMsgDoc = await saveMessage({
          userId: user.id,
          chatId,
          role: 'assistant',
          content: fullContent,
        });

        // Trigger Auto-Summary Check
        try {
          const { checkAndGenerateAutoSummary } = await import('@/lib/autoSummaryWatcher');
          await checkAndGenerateAutoSummary({
            userId: user.id,
            chatId,
            currentSequenceNumber: assistantMsgDoc.sequenceNumber
          });
        } catch (err) {
          console.error('Auto-summary check failed:', err);
        }

        // Send completion message
        const doneMessage = `data: ${JSON.stringify({ done: true })}\n\n`;
        controller.enqueue(encoder.encode(doneMessage));

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorMessage = `data: ${JSON.stringify({
          error: error.message,
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/secondStage/chat
 *
 * Retrieve chat message history
 * Query params: chatId
 * Returns: { messages: [...], chatId }
 */

// i guess the following shit does not work and is being used anywhere.
// stuff that is really being used to gather the user's chat history is this: src/app/api/secondStage/chats/route.js
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId parameter' },
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

    // Fetch message history from MongoDB
    const messages = await getMessageHistory({
      userId: user.id,
      chatId,
    });

    // Convert to format suitable for frontend (exclude system message)
    const formattedMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        id: m._id?.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));

    return NextResponse.json({
      messages: formattedMessages,
      chatId,
    });
  } catch (error) {
    console.error('Chat GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history', details: error.message },
      { status: 500 }
    );
  }
}
