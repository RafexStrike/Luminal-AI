// BACKEND CHAT IMPLEMENTATION GUIDE
// Context-Aware Chatting with HuggingFace Inference API + MongoDB

/**
 * ============================================
 * ARCHITECTURE OVERVIEW
 * ============================================
 * 
 * Problem Solved:
 * - HuggingFace Inference API is STATELESS (no built-in conversation memory)
 * - LLM cannot recall previous messages unless we resend them
 * - Solution: Store ALL messages in MongoDB, rebuild context on each request
 *
 * Key Insight:
 * Context awareness is NOT a property of the LLM—it's a property of the
 * request we send to the LLM. By resending previous messages, the model
 * becomes "aware" of the conversation.
 *
 * Constraint:
 * - Do NOT use global variables like let conversationHistory = []
 * - Do NOT assume HF manages sessions
 * - Context = messages array sent in POST request = messages stored in MongoDB
 */

/**
 * ============================================
 * DATA FLOW: Sending a Message
 * ============================================
 *
 * Timeline:
 *
 * 1. Frontend sends:
 *    POST /api/secondStage/chat
 *    {
 *      chatId: "507f1f77bcf86cd799439011",
 *      prompt: "What is photosynthesis?",
 *      provider: "huggingface",
 *      stream: false
 *    }
 *
 * 2. Backend (route.js):
 *    a. Authenticate user
 *    b. Load ALL messages for this chatId from MongoDB
 *       → SELECT * FROM stage2_messages WHERE chatId = ... ORDER BY sequenceNumber
 *       → Returns: [system_msg, user_msg_1, assistant_msg_1, user_msg_2, ...]
 *
 *    c. Append new user message to array (but don't save yet)
 *       → [system_msg, user_msg_1, assistant_msg_1, user_msg_2, user_msg_NEW]
 *
 *    d. Filter out system message, format for LLM
 *       → [
 *           { role: "user", content: "Previous question" },
 *           { role: "assistant", content: "Previous answer" },
 *           { role: "user", content: "New question" }
 *         ]
 *
 *    e. Call HuggingFace with FULL history (this is the context!)
 *       → hf.chatCompletionStream({
 *           model: "NousResearch/Hermes-3-Llama-3.1-8B",
 *           messages: [all_previous + current_user_msg],
 *           ...
 *         })
 *
 *    f. Stream response to frontend AND collect it
 *
 *    g. Save assistant's response to MongoDB
 *       → INSERT INTO stage2_messages VALUES (
 *           chatId, role="assistant", content="...", sequenceNumber=3, ...
 *         )
 *
 *    h. Check if first message: generate title from user's prompt
 *       → title = "What is photosynthesis" (first 5-7 words)
 *       → UPDATE stage2_chats SET title = ... WHERE _id = chatId
 *
 *    i. Return success + metadata
 *       → { content: "...", chatId, messageCount, provider }
 *
 * 3. Frontend displays response and asks for next prompt
 *
 * Next message: repeat step 2, but now MongoDB has an extra message in history
 * → Context grows → Model sees more conversation → Better awareness
 */

/**
 * ============================================
 * MONGODB SCHEMA
 * ============================================
 *
 * Collection: stage2_chats
 * Document:
 *   {
 *     _id: ObjectId -> string (chatId),
 *     userId: string,
 *     title: string,              // Auto-generated from first user message
 *     messageCount: number,        // For efficiency
 *     createdAt: Date,
 *     updatedAt: Date              // Updated on each new message
 *   }
 *
 * Example:
 *   {
 *     _id: "507f1f77bcf86cd799439011",
 *     userId: "user123",
 *     title: "What is photosynthesis",
 *     messageCount: 5,
 *     createdAt: 2026-01-09T10:00:00Z,
 *     updatedAt: 2026-01-09T10:15:00Z
 *   }
 *
 *
 * Collection: stage2_messages
 * Document:
 *   {
 *     _id: ObjectId,
 *     chatId: string,             // Foreign key to stage2_chats._id
 *     userId: string,
 *     role: string,               // "system" | "user" | "assistant"
 *     content: string,
 *     sequenceNumber: number,     // 0 for system, 1+ for others (defines order)
 *     createdAt: Date
 *   }
 *
 * Example sequence for one chat:
 *   {
 *     _id: ObjectId(...),
 *     chatId: "507f1f77bcf86cd799439011",
 *     userId: "user123",
 *     role: "system",
 *     content: "You are a helpful tutor...",
 *     sequenceNumber: 0,
 *     createdAt: 2026-01-09T10:00:00Z
 *   }
 *
 *   {
 *     _id: ObjectId(...),
 *     chatId: "507f1f77bcf86cd799439011",
 *     userId: "user123",
 *     role: "user",
 *     content: "What is photosynthesis?",
 *     sequenceNumber: 1,
 *     createdAt: 2026-01-09T10:01:00Z
 *   }
 *
 *   {
 *     _id: ObjectId(...),
 *     chatId: "507f1f77bcf86cd799439011",
 *     userId: "user123",
 *     role: "assistant",
 *     content: "Photosynthesis is the process...",
 *     sequenceNumber: 2,
 *     createdAt: 2026-01-09T10:02:00Z
 *   }
 *
 * Key Points:
 *   - One chat = one chatId = many messages
 *   - Messages are IMMUTABLE once saved
 *   - sequenceNumber determines order (always load ordered by this)
 *   - No message ever overwrites another
 */

/**
 * ============================================
 * API ENDPOINTS
 * ============================================
 */

/**
 * 1. POST /api/secondStage/new-chat
 *
 * Purpose: Create a new chat session
 *
 * Request:
 *   POST /api/secondStage/new-chat
 *   {}
 *
 * Response:
 *   {
 *     success: true,
 *     chatId: "507f1f77bcf86cd799439011",
 *     title: "New Chat",
 *     createdAt: "2026-01-09T10:00:00Z"
 *   }
 *
 * What happens:
 *   - Create stage2_chats document with this chatId
 *   - Insert system message into stage2_messages (sequenceNumber: 0)
 *   - Return chatId to frontend
 *   - Frontend remembers chatId for all future messages in this chat
 *
 * Important:
 *   - Does NOT reset the LLM model
 *   - Does NOT affect other chats
 *   - Title will be updated after first user message
 *
 * Implementation: src/app/api/secondStage/new-chat/route.js
 */

/**
 * 2. POST /api/secondStage/chat
 *
 * Purpose: Send a message and get a response
 *
 * Request:
 *   POST /api/secondStage/chat
 *   {
 *     chatId: "507f1f77bcf86cd799439011",
 *     prompt: "Explain the carbon cycle",
 *     provider: "huggingface",        // optional, default
 *     stream: false,                  // optional
 *     systemPrompt: "You are..."      // optional, override default
 *   }
 *
 * Response (non-streaming):
 *   {
 *     content: "The carbon cycle is...",
 *     chatId: "507f1f77bcf86cd799439011",
 *     messageCount: 4,
 *     provider: "huggingface",
 *     streaming: false
 *   }
 *
 * Response (streaming):
 *   Server-Sent Events (SSE):
 *   data: { content: "The " }
 *   data: { content: "carbon " }
 *   data: { content: "cycle " }
 *   ...
 *   data: { done: true }
 *
 * What happens:
 *   1. Load all messages for chatId from MongoDB
 *   2. Append new user message
 *   3. Send full history to HF API
 *   4. Stream/collect response
 *   5. Save assistant response to MongoDB
 *   6. If first user message, generate title
 *   7. Return response or stream
 *
 * Implementation: src/app/api/secondStage/chat/route.js
 */

/**
 * 3. GET /api/secondStage/chat?chatId=...
 *
 * Purpose: Retrieve message history for a chat (alternative endpoint)
 *
 * Request:
 *   GET /api/secondStage/chat?chatId=507f1f77bcf86cd799439011
 *
 * Response:
 *   {
 *     messages: [
 *       {
 *         id: "...",
 *         role: "user",
 *         content: "...",
 *         createdAt: "..."
 *       },
 *       ...
 *     ],
 *     chatId: "507f1f77bcf86cd799439011"
 *   }
 *
 * Implementation: src/app/api/secondStage/chat/route.js (GET handler)
 */

/**
 * 4. GET /api/secondStage/chats
 *
 * Purpose: List all chat sessions for sidebar
 *
 * Request:
 *   GET /api/secondStage/chats
 *
 * Response:
 *   {
 *     chats: [
 *       {
 *         _id: "507f1f77bcf86cd799439011",
 *         title: "What is photosynthesis",
 *         createdAt: "2026-01-09T10:00:00Z",
 *         updatedAt: "2026-01-09T10:15:00Z",
 *         messageCount: 5
 *       },
 *       {
 *         _id: "507f1f77bcf86cd799439012",
 *         title: "Explain the carbon cycle",
 *         createdAt: "2026-01-09T11:00:00Z",
 *         updatedAt: "2026-01-09T11:05:00Z",
 *         messageCount: 3
 *       }
 *     ]
 *   }
 *
 * Notes:
 *   - Sorted by updatedAt (most recent first)
 *   - Frontend uses _id as chatId to switch chats
 *   - Data from MongoDB, not memory
 *
 * Implementation: src/app/api/secondStage/chats/route.js
 */

/**
 * 5. GET /api/secondStage/chat-history?chatId=...
 *
 * Purpose: Load full conversation when user clicks a chat in sidebar
 *
 * Request:
 *   GET /api/secondStage/chat-history?chatId=507f1f77bcf86cd799439011
 *
 * Response:
 *   {
 *     success: true,
 *     chatId: "507f1f77bcf86cd799439011",
 *     messages: [
 *       {
 *         _id: "...",
 *         role: "system",
 *         content: "You are a helpful tutor...",
 *         sequenceNumber: 0,
 *         createdAt: "..."
 *       },
 *       {
 *         _id: "...",
 *         role: "user",
 *         content: "What is photosynthesis?",
 *         sequenceNumber: 1,
 *         createdAt: "..."
 *       },
 *       ...
 *     ]
 *   }
 *
 * Implementation: src/app/api/secondStage/chat-history/route.js
 */

/**
 * ============================================
 * CONTEXT MANAGEMENT
 * ============================================
 *
 * Problem: How does context awareness work if HF is stateless?
 *
 * Answer: We rebuild context on every request.
 *
 * Example conversation:
 *
 * User: "What is photosynthesis?"
 * → MongoDB stores: [system_msg, user_msg_1]
 * → Request to HF: [system_msg, user_msg_1]
 * → Response: "Photosynthesis is..."
 * → MongoDB stores: [system_msg, user_msg_1, assistant_msg_1]
 *
 * User: "Tell me about chlorophyll"
 * → MongoDB loads: [system_msg, user_msg_1, assistant_msg_1]
 * → Request to HF: [system_msg, user_msg_1, assistant_msg_1, user_msg_2]
 *   ↑ Previous context included! Model sees conversation history.
 * → Response: "Chlorophyll is the pigment..."
 * → MongoDB stores: [system_msg, user_msg_1, assistant_msg_1, user_msg_2, assistant_msg_2]
 *
 * User: "How is it different from carotenoids?"
 * → MongoDB loads: [system_msg, user_msg_1, assistant_msg_1, user_msg_2, assistant_msg_2]
 * → Request to HF: [...full history... user_msg_3]
 * → Response: "Carotenoids are..."
 * → MongoDB stores: [...all previous... user_msg_3, assistant_msg_3]
 *
 * Key insight:
 * - Each request sends FULL conversation history to HF
 * - HF doesn't remember previous requests
 * - But the model sees the conversation in each request
 * - Statelessness is handled by MongoDB + context rebuilding
 */

/**
 * ============================================
 * COST CONSIDERATIONS
 * ============================================
 *
 * Token cost per request:
 *   - First message: cost = tokens(system) + tokens(user_msg)
 *   - Second message: cost = tokens(system) + tokens(user_msg_1) + tokens(assistant_msg_1) + tokens(user_msg_2)
 *   - Grows linearly with conversation length
 *
 * Optimization (future):
 *   - Implement message summarization after N messages
 *   - Keep recent messages, compress old ones
 *   - Limit context window to last K messages + summary
 *
 * For now: Send full history (simple, correct, but costs more for long conversations)
 */

/**
 * ============================================
 * TITLE GENERATION
 * ============================================
 *
 * When: After first user message is received
 *
 * How:
 *   1. User sends prompt: "What is photosynthesis? Tell me everything."
 *   2. Backend saves user message to MongoDB
 *   3. Check: Is this the first user message? (messageHistory.length === 1)
 *   4. If yes:
 *      - Extract first 5-7 words: "What is photosynthesis"
 *      - UPDATE stage2_chats SET title = "What is photosynthesis"
 *   5. Title appears in sidebar
 *
 * Code:
 *   const isFirstMessage = messageHistory.length === 1;
 *   if (isFirstMessage) {
 *     const title = generateChatTitle(prompt);
 *     await updateChatTitle({ userId, chatId, title });
 *   }
 *
 * Function: generateChatTitle(userMessage)
 *   - Splits by whitespace
 *   - Takes first 7 words
 *   - Joins back together
 *   - Returns string (fallback: "New Chat")
 *
 * Implementation: src/lib/SECONDARY_db.js
 */

/**
 * ============================================
 * SIDEBAR BEHAVIOR
 * ============================================
 *
 * Sidebar shows: List of previous chats
 *
 * Flow:
 *   1. User opens app
 *   2. Frontend calls: GET /api/secondStage/chats
 *   3. Backend queries: SELECT * FROM stage2_chats WHERE userId = ... ORDER BY updatedAt DESC
 *   4. Returns: [{ _id, title, createdAt, updatedAt, messageCount }, ...]
 *   5. Frontend renders list of titles
 *   6. User clicks a title
 *   7. Frontend calls: GET /api/secondStage/chat-history?chatId=...
 *   8. Backend loads full message history from MongoDB
 *   9. Frontend displays all messages
 *   10. User can now continue the conversation
 *   11. Frontend sends next prompt to: POST /api/secondStage/chat with same chatId
 *   12. Backend loads history, appends prompt, sends to HF, saves response
 *   13. Conversation continues with same context
 *
 * Important:
 *   - No in-memory state is required
 *   - All data is loaded from MongoDB on demand
 *   - Multiple devices/sessions will see the same chats (because MongoDB is source of truth)
 *   - Old chats are never deleted (unless explicitly implemented)
 */

/**
 * ============================================
 * KEY FILES
 * ============================================
 *
 * src/lib/SECONDARY_providers.js
 *   - callProvider(options) → routes to correct LLM
 *   - callHuggingFace(options) → uses InferenceClient
 *   - Returns: string (non-stream) or { stream: true, iterator } (stream)
 *
 * src/lib/SECONDARY_db.js
 *   - getMongoClient() → MongoDB connection pool
 *   - saveMessage() → insert message into stage2_messages
 *   - getMessageHistory() → load all messages for chatId
 *   - createNewChat() → create chat + system message
 *   - updateChatTitle() → update title after first message
 *   - getChatList() → list all chats for user
 *   - generateChatTitle() → extract title from prompt
 *
 * src/app/api/secondStage/chat/route.js
 *   - POST /api/secondStage/chat → send message, get response
 *   - GET /api/secondStage/chat → retrieve message history
 *   - Main handler for conversation logic
 *
 * src/app/api/secondStage/new-chat/route.js
 *   - POST /api/secondStage/new-chat → create new chat session
 *
 * src/app/api/secondStage/chats/route.js
 *   - GET /api/secondStage/chats → list all chats (sidebar)
 *
 * src/app/api/secondStage/chat-history/route.js
 *   - GET /api/secondStage/chat-history?chatId=... → load old conversation
 */

/**
 * ============================================
 * TESTING THE IMPLEMENTATION
 * ============================================
 *
 * 1. Ensure environment variables are set:
 *    HUGGINGFACE_API_KEY = your HF token
 *    SECONDARY_MONGODB_URI = your MongoDB connection string
 *
 * 2. Create new chat:
 *    POST /api/secondStage/new-chat
 *    Response: { chatId, title, ... }
 *
 * 3. Send first message:
 *    POST /api/secondStage/chat
 *    { chatId, prompt: "What is photosynthesis?" }
 *    Response: { content, messageCount: 2 }
 *    (system + user message saved)
 *
 * 4. Check MongoDB:
 *    stage2_chats: 1 doc with title updated
 *    stage2_messages: 2 docs (system + user)
 *
 * 5. Send second message:
 *    POST /api/secondStage/chat
 *    { chatId, prompt: "Tell me about chlorophyll" }
 *    Backend loads 2 messages, adds user msg, sends 3 to HF
 *    Response includes full answer
 *
 * 6. Verify context awareness:
 *    Model should reference previous answer
 *    Example: "As I mentioned in my previous response about photosynthesis..."
 *
 * 7. List chats:
 *    GET /api/secondStage/chats
 *    Response: [{ _id: chatId, title: "What is photosynthesis", ... }]
 *
 * 8. Load conversation:
 *    GET /api/secondStage/chat-history?chatId=...
 *    Response: full message array
 *
 * 9. Continue conversation:
 *    POST /api/secondStage/chat with same chatId
 *    Model sees all previous messages
 */

/**
 * ============================================
 * CONSTRAINTS & GUARANTEES
 * ============================================
 *
 * What is GUARANTEED:
 *   ✓ Messages are stored persistently in MongoDB
 *   ✓ Each chatId is a separate conversation
 *   ✓ Messages are ordered by sequenceNumber
 *   ✓ No message is lost or duplicated
 *   ✓ Model sees full conversation history (context-aware)
 *   ✓ Multiple users don't see each other's chats
 *   ✓ Old chats persist when creating new chats
 *   ✓ Chat titles are auto-generated from first user message
 *
 * What is NOT guaranteed:
 *   ✗ Don't use in-memory variables for persistence
 *   ✗ Don't assume HF has session memory
 *   ✗ Don't try to optimize without understanding costs
 *   ✗ Don't send messages out of order
 *   ✗ Don't forget to authenticate users
 *
 * What MIGHT happen:
 *   ? Network latency: HF API might be slow
 *   ? Token limits: Very long conversations might hit max_tokens
 *   ? Cost: Each message sends full history (watch token usage)
 *   ? Rate limits: HF might throttle requests
 *
 * Mitigation:
 *   - Implement message pagination/summarization (future)
 *   - Add request timeouts
 *   - Batch requests if needed
 *   - Monitor token usage
 */

/**
 * ============================================
 * FUTURE IMPROVEMENTS
 * ============================================
 *
 * 1. Message summarization:
 *    - After N messages, summarize older messages
 *    - Keep recent messages + summary for context
 *    - Reduces token costs for long conversations
 *
 * 2. Streaming UI:
 *    - Display response token-by-token
 *    - Better UX for long responses
 *    - Implemented via SSE in chat route
 *
 * 3. Message editing/deletion:
 *    - Allow user to edit own messages
 *    - Regenerate assistant response with new context
 *    - Delete messages from conversation
 *
 * 4. Conversation branching:
 *    - Fork a chat at a specific message
 *    - Continue in different direction
 *    - Experimental/comparison mode
 *
 * 5. Memory persistence across devices:
 *    - Already works (MongoDB is source of truth)
 *    - Just need to load chats on app open
 *
 * 6. Automatic retry on failure:
 *    - Handle HF API errors gracefully
 *    - Retry with exponential backoff
 */

export default {}; // Placeholder for valid JS export
