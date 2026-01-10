# Backend Chat Implementation - Complete Guide

## 🎯 Overview

This implementation provides a **context-aware chat backend** using:
- **LLM**: HuggingFace Inference API with `NousResearch/Hermes-3-Llama-3.1-8B`
- **Database**: MongoDB for persistent message storage
- **Framework**: Next.js API Routes
- **Architecture**: Stateless LLM + stateful message database

### Key Principle

> HuggingFace is completely stateless. Context awareness is NOT a property of the LLM—it's a property of the request we send. By resending the full conversation history on each request, the model "becomes aware" of the conversation.

---

## 📦 Files Modified/Created

### Modified Files

1. **`src/lib/SECONDARY_providers.js`**
   - Updated `callHuggingFace()` to use `@huggingface/inference` InferenceClient
   - Uses model: `NousResearch/Hermes-3-Llama-3.1-8B`
   - Returns streaming iterator or full content string
   - Supports both streaming and non-streaming requests

2. **`src/lib/SECONDARY_db.js`**
   - Added `saveMessage()` - Store individual messages in MongoDB
   - Added `getMessageHistory()` - Load all messages for a chatId
   - Added `createNewChat()` - Create new chat session with system message
   - Added `updateChatTitle()` - Update title after first user message
   - Added `getChatList()` - List all chats for sidebar
   - Added `generateChatTitle()` - Extract title from prompt (first 5-7 words)

3. **`src/app/api/secondStage/chat/route.js`**
   - **POST** - Send message and get response
     - Loads message history from MongoDB (context)
     - Appends new user message
     - Sends full history to HuggingFace
     - Saves assistant response to MongoDB
     - Auto-generates chat title on first message
   - **GET** - Retrieve message history for a chat

### Created Files

4. **`src/app/api/secondStage/new-chat/route.js`**
   - **POST** - Create new chat session
   - Initializes with system message
   - Returns chatId for frontend

5. **`src/app/api/secondStage/chats/route.js`**
   - **GET** - List all chat sessions (for sidebar)
   - Sorted by most recent first
   - Returns: `[{ _id, title, createdAt, updatedAt, messageCount }]`

6. **`src/app/api/secondStage/chat-history/route.js`**
   - **GET** - Load full conversation for a specific chat
   - Query param: `chatId`
   - Used when resuming old conversations

---

## ⚙️ Setup

### Environment Variables

Add to `.env.local`:

```
# HuggingFace API
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxx

# MongoDB
SECONDARY_MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/youlearn?retryWrites=true&w=majority
```

**Get these values:**

1. **HuggingFace Token**:
   - Go to https://huggingface.co/settings/tokens
   - Create new token with read access
   - Copy to `HUGGINGFACE_API_KEY`

2. **MongoDB URI**:
   - Go to MongoDB Atlas
   - Click "Connect" → "Drivers"
   - Copy connection string
   - Replace `<password>` with actual password

### MongoDB Collections

The system automatically creates these collections:

**`stage2_chats`** - Chat sessions
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "title": "What is photosynthesis",
  "messageCount": 5,
  "createdAt": "2026-01-09T10:00:00Z",
  "updatedAt": "2026-01-09T10:15:00Z"
}
```

**`stage2_messages`** - Individual messages (conversation history)
```json
{
  "_id": "ObjectId(...)",
  "chatId": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "role": "user",
  "content": "What is photosynthesis?",
  "sequenceNumber": 1,
  "createdAt": "2026-01-09T10:01:00Z"
}
```

---

## 🔄 Data Flow

### Message Sending Flow

```
1. User sends: "What is photosynthesis?"
   ↓
2. Frontend calls: POST /api/secondStage/chat
   { chatId, prompt: "What is photosynthesis?" }
   ↓
3. Backend loads: SELECT * FROM stage2_messages WHERE chatId = ...
   → Returns: [system_msg, user_msg_1, assistant_msg_1, ...]
   ↓
4. Backend appends new message to array
   → [system_msg, user_msg_1, assistant_msg_1, user_msg_NEW]
   ↓
5. Backend sends to HuggingFace:
   → FULL conversation history
   → Model sees entire conversation (context-aware)
   ↓
6. Model responds based on full conversation
   → Understands previous context
   ↓
7. Backend saves response to MongoDB
   → INSERT INTO stage2_messages (assistant response)
   ↓
8. Return response to frontend
   → { content: "Photosynthesis is...", messageCount: 3 }
```

### Context Building

```python
# Every request rebuilds context from database
messageHistory = getMessageHistory(userId, chatId)
# Returns: [
#   {role: "system", content: "..."},
#   {role: "user", content: "What is X?"},
#   {role: "assistant", content: "X is..."},
#   {role: "user", content: "Tell me about Y"}
# ]

# Filter out system message (provider adds its own)
contextMessages = [m for m in messageHistory if m.role != "system"]
# Returns: [
#   {role: "user", content: "What is X?"},
#   {role: "assistant", content: "X is..."},
#   {role: "user", content: "Tell me about Y"}
# ]

# Send to HuggingFace (this is the context!)
hfResponse = callProvider(messages=contextMessages + [newUserMsg])
```

---

## 📡 API Endpoints

### 1. Create New Chat
```
POST /api/secondStage/new-chat

Request:
{}

Response:
{
  "success": true,
  "chatId": "507f1f77bcf86cd799439011",
  "title": "New Chat",
  "createdAt": "2026-01-09T10:00:00Z"
}
```

### 2. Send Message
```
POST /api/secondStage/chat

Request:
{
  "chatId": "507f1f77bcf86cd799439011",
  "prompt": "What is photosynthesis?",
  "provider": "huggingface",       // optional
  "stream": false,                  // optional
  "systemPrompt": "You are..."     // optional
}

Response (non-streaming):
{
  "content": "Photosynthesis is the process...",
  "chatId": "507f1f77bcf86cd799439011",
  "messageCount": 3,
  "provider": "huggingface",
  "streaming": false
}

Response (streaming):
Server-Sent Events:
data: { content: "Photosynthesis" }
data: { content: " is" }
...
data: { done: true }
```

### 3. Get Message History
```
GET /api/secondStage/chat?chatId=...

Response:
{
  "messages": [
    {
      "id": "...",
      "role": "user",
      "content": "What is X?",
      "createdAt": "..."
    },
    ...
  ],
  "chatId": "507f1f77bcf86cd799439011"
}
```

### 4. List All Chats (Sidebar)
```
GET /api/secondStage/chats

Response:
{
  "chats": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "What is photosynthesis",
      "createdAt": "2026-01-09T10:00:00Z",
      "updatedAt": "2026-01-09T10:15:00Z",
      "messageCount": 5
    },
    ...
  ]
}
```

### 5. Load Conversation
```
GET /api/secondStage/chat-history?chatId=...

Response:
{
  "success": true,
  "chatId": "507f1f77bcf86cd799439011",
  "messages": [
    {
      "_id": "...",
      "role": "system",
      "content": "You are a helpful tutor...",
      "sequenceNumber": 0,
      "createdAt": "..."
    },
    ...
  ]
}
```

---

## 🧪 Testing

### 1. Create New Chat
```bash
curl -X POST http://localhost:3000/api/secondStage/new-chat \
  -H "Content-Type: application/json"
```

### 2. Send First Message
```bash
curl -X POST http://localhost:3000/api/secondStage/chat \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "507f1f77bcf86cd799439011",
    "prompt": "What is photosynthesis?",
    "provider": "huggingface"
  }'
```

### 3. List All Chats
```bash
curl http://localhost:3000/api/secondStage/chats
```

### 4. Check MongoDB
```bash
mongosh "mongodb+srv://..."
use youlearn
db.stage2_chats.find()
db.stage2_messages.find()
```

---

## 🎯 Key Features

### ✅ Context Awareness
- Full conversation history sent with each request
- Model sees entire conversation
- No in-memory state required
- Stateless LLM, stateful database

### ✅ Chat Sessions
- Each `chatId` = independent conversation
- Multiple chats don't interfere
- Old chats persist
- Easy to resume

### ✅ Auto-Generated Titles
- Title extracted from first user message
- First 5-7 words become the chat title
- Updated in database immediately
- Appears in sidebar

### ✅ Sidebar Support
- List all user chats
- Click to resume conversation
- Sorted by most recent
- From database (not memory)

### ✅ Streaming Support
- Server-Sent Events (SSE) format
- Token-by-token response
- Saved to database after complete

### ✅ Authentication
- User isolation (no cross-user access)
- Each message tagged with userId
- Automatic filtering by userId

---

## ⚠️ Important Constraints

### ✓ DO:
- Load message history from MongoDB on each request
- Send FULL message array to HuggingFace
- Save messages individually with sequenceNumber
- Authenticate users before accessing chats
- Generate title from first user message only
- Return chatId from new-chat endpoint

### ✗ DON'T:
- Use global/in-memory variables for messages
- Assume HuggingFace has session memory
- Send only latest message to LLM (loses context)
- Reorder messages (breaks conversation flow)
- Allow cross-user chat access
- Generate title for every message

---

## 🔍 Debugging Tips

### Issue: Context Not Working
**Solution**: Check MongoDB has previous messages loaded
```bash
db.stage2_messages.find({chatId: "..."}).sort({sequenceNumber: 1})
```

### Issue: Title Not Generated
**Solution**: Verify first message detection
```javascript
const isFirstMessage = messageHistory.length === 1; // Only system message
```

### Issue: HuggingFace API Timeout
**Solution**: Check token usage and rate limits
- Model may be overloaded
- Try with shorter context window
- Monitor API quotas

### Issue: Authentication Fails
**Solution**: Ensure user is logged in
```javascript
const user = await getUserIfAuthenticated(req);
if (!user) return NextResponse.json({error: "Auth required"}, {status: 401});
```

---

## 📊 Cost Considerations

### Token Usage Pattern
- First message: ~2 tokens/word for system + user prompt
- Second message: ~2 tokens/word for (all previous + new)
- Grows linearly with conversation length

### Example
```
Chat with 10 messages (avg 20 words each):
Total context: ~200 words = ~400 tokens per request

Message 1: 2 tokens (system: 1, user: 1)
Message 2: 4 tokens (system: 1, prev_user: 1, prev_assistant: 1, new_user: 1)
Message 10: 20 tokens (system: 1, prev: 18, new: 1)
```

### Optimization (Future)
- Implement message summarization after N turns
- Keep recent messages + compressed summary
- Implement sliding window (last K messages only)

---

## 📚 Documentation

Created comprehensive guides:

1. **BACKEND_CHAT_GUIDE.md** - Architecture & detailed explanation
2. **BACKEND_CHAT_PATTERNS.js** - Copy-paste implementation patterns
3. **IMPLEMENTATION_SUMMARY.md** - Setup & testing checklist
4. **EXPECTED_BEHAVIOR.md** - Real-world examples & timelines
5. **README.md** (this file) - Quick reference

---

## 🚀 Next Steps

### Frontend Integration
1. Update `SECONDARY_ChatWindow.jsx`:
   - Call `POST /api/secondStage/new-chat` to create chat
   - Store chatId in state
   - Call `POST /api/secondStage/chat` to send messages

2. Update `SECONDARY_ChatSidebar.jsx`:
   - Call `GET /api/secondStage/chats` on mount
   - Display returned chats
   - Clicking chat → `GET /api/secondStage/chat-history`
   - Switch to that chatId

3. Add streaming UI:
   - Listen to SSE stream
   - Display chunks as they arrive
   - Show loading indicator

### Backend Enhancements
1. Add message pagination for very long chats
2. Implement message summarization
3. Add rate limiting & caching
4. Monitor token usage
5. Add error recovery

### Features to Add
1. Message editing & regeneration
2. Conversation branching
3. Message deletion
4. Search chat history
5. Export conversations

---

## 🤝 Support

For issues or questions:
1. Check EXPECTED_BEHAVIOR.md for examples
2. Review MongoDB schema in this README
3. Check logs: `console.error()` statements in routes
4. Verify environment variables are set
5. Test HuggingFace API separately

---

## 📝 License

This implementation is part of the Capstone/Luminal project.

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and Ready for Integration
