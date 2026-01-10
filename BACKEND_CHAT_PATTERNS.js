/**
 * BACKEND CHAT IMPLEMENTATION - QUICK REFERENCE
 * 
 * This file shows the key implementation patterns used throughout the backend.
 * Copy and adapt these patterns when extending or modifying the chat system.
 */

// ============================================
// PATTERN 1: Loading Context from MongoDB
// ============================================

/**
 * Every request starts by loading the message history.
 * This is the source of "context" for the LLM.
 */

import { getMessageHistory } from '@/lib/SECONDARY_db';

async function loadContext(userId, chatId) {
  // Fetch ALL messages for this chat, ordered by time
  const messageHistory = await getMessageHistory({
    userId,
    chatId,
  });

  // Filter out system message (LLM provider adds its own)
  const contextMessages = messageHistory
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  return contextMessages;
}

// Usage:
//   const context = await loadContext(user.id, chatId);
//   // context = [{ role: "user", content: "..." }, { role: "assistant", ... }, ...]


// ============================================
// PATTERN 2: Appending User Message
// ============================================

/**
 * Add the new user message to the context array.
 * This is what we send to HF (plus system prompt).
 */

async function buildRequestPayload(context, userPrompt) {
  const userMessage = {
    role: 'user',
    content: userPrompt,
  };

  const messagesToSend = [...context, userMessage];

  return messagesToSend;
  // messagesToSend = [prev_user, prev_assistant, prev_user, ..., NEW_USER_MESSAGE]
}

// Usage:
//   const context = await loadContext(user.id, chatId);
//   const payload = await buildRequestPayload(context, userPrompt);
//   const response = await callProvider({
//     messages: payload,  // FULL HISTORY
//     ...
//   });


// ============================================
// PATTERN 3: Saving Messages to MongoDB
// ============================================

/**
 * Save both user and assistant messages.
 * Ensure sequenceNumber increments for ordering.
 */

import { saveMessage } from '@/lib/SECONDARY_db';

async function saveConversationTurn(userId, chatId, userPrompt, assistantResponse) {
  // Save user message
  const userMsg = await saveMessage({
    userId,
    chatId,
    role: 'user',
    content: userPrompt,
  });
  console.log('Saved user message:', userMsg._id);

  // Save assistant message
  const assistantMsg = await saveMessage({
    userId,
    chatId,
    role: 'assistant',
    content: assistantResponse,
  });
  console.log('Saved assistant message:', assistantMsg._id);

  return { userMsg, assistantMsg };
}

// Usage:
//   await saveConversationTurn(user.id, chatId, "What is X?", "X is...");


// ============================================
// PATTERN 4: Generating Chat Title (First Message)
// ============================================

/**
 * After first user message, extract first 5-7 words as title.
 * Update the chat document in MongoDB.
 */

import { generateChatTitle, updateChatTitle } from '@/lib/SECONDARY_db';

async function setInitialTitle(userId, chatId, firstUserMessage, messageHistory) {
  // Check if this is the first user message
  const isFirstMessage = messageHistory.length === 1; // Only system message

  if (isFirstMessage) {
    // Extract title from prompt
    const title = generateChatTitle(firstUserMessage);
    console.log('Generated title:', title);

    // Update database
    await updateChatTitle({
      userId,
      chatId,
      title,
    });

    console.log('Chat title updated to:', title);
  }
}

// Usage:
//   const messageHistory = await getMessageHistory({ userId, chatId });
//   await setInitialTitle(user.id, chatId, userPrompt, messageHistory);


// ============================================
// PATTERN 5: Calling HuggingFace Provider
// ============================================

/**
 * Send the full message history to HF.
 * HF doesn't remember previous requests (stateless).
 * But it sees the conversation in this request (context-aware).
 */

import { callProvider } from '@/lib/SECONDARY_providers';

async function callHFWithContext(messagePayload, customSystemPrompt) {
  const response = await callProvider({
    provider: 'huggingface',
    apiKey: null, // Uses env var: HUGGINGFACE_API_KEY
    messages: messagePayload, // FULL CONVERSATION HISTORY
    stream: false, // Or true for streaming
    systemPrompt: customSystemPrompt || 'You are a helpful tutor...',
  });

  // Non-streaming: response is a string
  // Streaming: response is { stream: true, iterator: ... }

  return response;
}

// Usage:
//   const contextMessages = [...previous messages...];
//   const response = await callHFWithContext(contextMessages);
//   console.log('Assistant:', response);


// ============================================
// PATTERN 6: Handling Streaming Responses
// ============================================

/**
 * For streaming, iterate over chunks and send them as SSE.
 * Collect full content while streaming.
 */

async function handleStreaming(iterator, userId, chatId) {
  let fullContent = '';
  const chunks = [];

  // Iterate over streaming chunks from HF
  for await (const chunk of iterator) {
    if (chunk.choices && chunk.choices[0]) {
      const delta = chunk.choices[0].delta?.content || '';
      fullContent += delta;
      chunks.push(delta);

      // Send to client (SSE format)
      // client.send(JSON.stringify({ content: delta }));
    }
  }

  // After streaming completes, save to DB
  await saveMessage({
    userId,
    chatId,
    role: 'assistant',
    content: fullContent, // FULL RESPONSE
  });

  return fullContent;
}

// Usage:
//   const result = await callProvider({ messages, stream: true });
//   if (result.stream) {
//     const content = await handleStreaming(result.iterator, user.id, chatId);
//   }


// ============================================
// PATTERN 7: Creating New Chat Session
// ============================================

/**
 * When user clicks "New Chat", create a new session.
 * This does NOT reset the LLM—each chatId is independent.
 */

import { createNewChat } from '@/lib/SECONDARY_db';

async function startNewConversation(userId, optionalTitle) {
  // Create chat document + system message in MongoDB
  const newChat = await createNewChat({
    userId,
    title: optionalTitle || null, // Will be set after first user message
  });

  console.log('New chat created:', newChat.chatId);
  console.log('Title:', newChat.title);

  return newChat.chatId;
}

// Usage:
//   const chatId = await startNewConversation(user.id);
//   // Frontend now sends messages to POST /api/secondStage/chat with this chatId


// ============================================
// PATTERN 8: Retrieving Chat List (Sidebar)
// ============================================

/**
 * Get all chats for a user to populate the sidebar.
 * Sorted by most recent first.
 */

import { getChatList } from '@/lib/SECONDARY_db';

async function loadChatSidebar(userId) {
  const chats = await getChatList({ userId });

  // chats = [
  //   { _id: "507f...", title: "What is X?", updatedAt: "...", messageCount: 5 },
  //   { _id: "507f...", title: "How to do Y?", updatedAt: "...", messageCount: 3 },
  //   ...
  // ]

  return chats.map((chat) => ({
    chatId: chat._id, // Use _id as chatId
    title: chat.title,
    lastUpdated: chat.updatedAt,
  }));
}

// Usage in route handler:
//   const sidebarChats = await loadChatSidebar(user.id);
//   return NextResponse.json({ chats: sidebarChats });


// ============================================
// PATTERN 9: Resuming Old Conversation
// ============================================

/**
 * When user clicks a chat in sidebar, load full history.
 * This restores the conversation context.
 */

async function resumeConversation(userId, chatId) {
  // Load all messages for this chat
  const messages = await getMessageHistory({
    userId,
    chatId,
  });

  // Filter out system message for display
  const displayMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      id: m._id?.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));

  return displayMessages;
}

// Usage:
//   const history = await resumeConversation(user.id, chatId);
//   // Frontend displays: user_msg_1, assistant_msg_1, user_msg_2, ...
//   // User can now continue chatting in this chat


// ============================================
// PATTERN 10: Complete Chat Handler (Full Flow)
// ============================================

/**
 * This is what the route handler does.
 * Step-by-step execution of a chat request.
 */

async function completeChatFlow(req) {
  // Step 1: Parse request
  const { chatId, prompt, provider = 'huggingface', stream = false } = await req.json();

  // Step 2: Authenticate
  const user = await getUserIfAuthenticated(req);
  if (!user) throw new Error('Not authenticated');

  // Step 3: Load context
  const messageHistory = await getMessageHistory({ userId: user.id, chatId });
  const context = messageHistory
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  // Step 4: Build payload
  const payload = [...context, { role: 'user', content: prompt }];

  // Step 5: Check if first message
  const isFirstMessage = messageHistory.length === 1;
  if (isFirstMessage) {
    const title = generateChatTitle(prompt);
    await updateChatTitle({ userId: user.id, chatId, title });
  }

  // Step 6: Call LLM
  const hfResponse = await callProvider({
    provider,
    messages: payload,
    stream,
    systemPrompt: 'You are a helpful tutor...',
  });

  // Step 7: Save and return
  if (stream) {
    // Handle streaming...
    let fullContent = '';
    for await (const chunk of hfResponse.iterator) {
      if (chunk.choices?.[0]) {
        fullContent += chunk.choices[0].delta?.content || '';
      }
    }
    await saveMessage({ userId: user.id, chatId, role: 'assistant', content: fullContent });
    return { content: fullContent, streaming: true };
  } else {
    // Non-streaming
    await saveMessage({ userId: user.id, chatId, role: 'assistant', content: hfResponse });
    return { content: hfResponse, streaming: false };
  }
}


// ============================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================

/**
 * Set these in .env.local:
 *
 * HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
 * SECONDARY_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
 */


// ============================================
// DEBUGGING TIPS
// ============================================

/**
 * 1. Check MongoDB:
 *    - Use MongoDB Atlas GUI or mongosh
 *    - Query: db.stage2_chats.find({})
 *    - Query: db.stage2_messages.find({ chatId: "..." })
 *
 * 2. Check context loading:
 *    - Add console.log(messageHistory) in route handler
 *    - Should show all messages ordered by sequenceNumber
 *
 * 3. Check HF API:
 *    - Make sure HUGGINGFACE_API_KEY is set
 *    - Test with curl:
 *      curl -X POST https://api-inference.huggingface.co/models/NousResearch/Hermes-3-Llama-3.1-8B/v1/chat/completions \
 *        -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
 *        -H "Content-Type: application/json" \
 *        -d '{"messages": [{"role": "user", "content": "Hello"}]}'
 *
 * 4. Check title generation:
 *    - First message should have messageHistory.length === 1
 *    - Title should be first 5-7 words
 *
 * 5. Check streaming:
 *    - For streaming, expect multiple SSE chunks
 *    - Each chunk is: data: { content: "..." }\n\n
 *    - Final message: data: { done: true }\n\n
 */

export default {}; // Placeholder
