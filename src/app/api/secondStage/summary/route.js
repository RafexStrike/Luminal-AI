// FILE: src/app/api/secondStage/summary/route.js
// DESCRIPTION: Summary generation endpoint; supports normal markdown and incremental JSON modes

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveSummary } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/summary
 * 
 * Request body:
 *   {
 *     chatId: string,
 *     messageIds: string[],
 *     mode: "normal" | "incremental" (default: "normal"),
 *     provider: string (optional, defaults to "openai"),
 *     apiKey: string (optional)
 *   }
 * 
 * Response:
 *   {
 *     summary: string (markdown for normal mode) or object (JSON for incremental mode),
 *     mode: string,
 *     messageCount: number,
 *     savedId: string
 *   }
 * 
 * Data flow:
 *   1. Validate auth (anonymous OK for generation, but not for saving)
 *   2. Parse selected message IDs from messageIds array
 *   3. Build prompt based on mode:
 *      - normal: "Summarize the following discussion in 150-300 words..."
 *      - incremental: JSON structure with sections (key_points, examples, questions)
 *   4. Call provider adapter with constructed messages array
 *   5. For incremental mode: validate response is valid JSON
 *   6. Save summary to DB (only if auth)
 *   7. Return summary content
 */
export async function POST(req) {
  try {
    const {
      chatId,
      messageIds = [],
      mode = 'normal',
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

    // Get authenticated user (optional for generation, required for saving)
    const user = await getUserIfAuthenticated(req);

    // TODO: Fetch actual messages from DB using messageIds
    // For now, use placeholder messages
    const placeholderMessages = messageIds.map((id) => ({
      role: 'assistant',
      content: `[Message ${id} content placeholder]`,
    }));

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'incremental') {
      // Incremental JSON mode: request structured output
      systemPrompt = 'You are an expert tutor. Provide structured learning materials in JSON format.';

      const jsonInstruction = {
        task: 'incremental_summary',
        document: placeholderMessages.map((msg, idx) => ({
          id: messageIds[idx],
          role: msg.role,
          content: msg.content,
        })),
        instructions: {
          sections: ['key_points', 'examples', 'questions'],
          format: 'json',
        },
      };

      userPrompt = `Generate an incremental summary in JSON format:\n${JSON.stringify(jsonInstruction, null, 2)}\n\nRespond with ONLY valid JSON (no markdown, no explanation).`;
    } else {
      // Normal markdown mode
      systemPrompt =
        'You are a concise tutor. Summarize content in markdown format, 150-300 words.';
      userPrompt = `Summarize the following discussion:\n\n${placeholderMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n')}`;
    }

    // Call provider adapter
    const summaryContent = await callProvider({
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

    // Validate JSON for incremental mode
    let parsedSummary = summaryContent;
    if (mode === 'incremental') {
      try {
        // Try to parse as JSON and validate structure
        const parsed = JSON.parse(summaryContent);
        if (!parsed.key_points || !parsed.examples || !parsed.questions) {
          console.warn('Invalid incremental summary structure:', parsed);
        }
        parsedSummary = parsed;
      } catch (parseError) {
        console.error('JSON parse error in incremental mode:', parseError);
        return Response.json(
          { error: 'Failed to parse LLM response as JSON. Try again.' },
          { status: 400 }
        );
      }
    }

    // Save summary to DB if user authenticated
    let savedId = null;
    if (user) {
      try {
        const result = await saveSummary({
          userId: user.id,
          chatId,
          messageIds,
          content: typeof parsedSummary === 'string' ? parsedSummary : JSON.stringify(parsedSummary),
          type: mode,
        });
        savedId = result._id?.toString();
      } catch (dbError) {
        console.error('Error saving summary to DB:', dbError);
        // Don't fail response if DB save fails
      }
    }

    return Response.json({
      summary: parsedSummary,
      mode,
      messageCount: messageIds.length,
      savedId,
      provider,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
