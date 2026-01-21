# RAG (Retrieval Augmented Generation) System - Complete Implementation

## ⚠️ CRITICAL: Non-Breaking Architecture

This RAG system is designed as a **completely optional, additive layer** on top of the existing chat system. 

### Key Design Principle
```
If RAG is not used, the application behaves EXACTLY as before.
```

No existing code has been modified or broken. All RAG functionality can be disabled by simply not using it.

---

## 📁 File Structure

### Backend RAG System (`src/lib/rag/`)

```
src/lib/rag/
├── index.js                 # Main entry point and orchestration
├── embedder.js             # HuggingFace text-to-vector conversion
├── vectorStore.js          # MongoDB vector database abstraction
├── retriever.js            # Document search and ranking
├── promptBuilder.js        # Context formatting and augmentation
├── chunker.js              # Document splitting for embedding
└── README.md               # Detailed backend documentation
```

### Frontend RAG UI (`src/components/rag/`)

```
src/components/rag/
├── RagSlashMenu.jsx        # Slash command menu (/context-*)
├── RagSourceSelector.jsx   # Multi-select for context sources
├── RagContextPreview.jsx   # Shows retrieved context before sending
├── rag.constants.js        # Configuration and constants
└── README.md               # UI integration guide
```

### Modified Existing File

```
src/app/api/secondStage/chat/route.js  # Added RAG processing step (non-breaking)
```

---

## 🚀 Quick Start: Adding RAG to Your Chat

### 1. Backend: Import RAG Orchestration

In any route that sends messages to the LLM:

```javascript
import { processWithRAG } from '@/lib/rag/index.js';
```

### 2. Process Message with RAG (Optional)

```javascript
// In your chat route BEFORE calling the LLM:

if (ragMetadata) {
  const ragResult = await processWithRAG({
    userId: user.id,
    prompt: userMessage,
    ragConfig: {
      sources: ragMetadata.sources, // ['flashcard', 'note', etc.]
      topK: 5,
      threshold: 0.3,
    },
  });

  // Use augmented prompt
  if (ragResult.ragEnabled) {
    userMessage = ragResult.augmentedPrompt;
  }
}

// Continue with existing LLM call (unchanged)
await callProvider({ messages: [..., userMessage], ... });
```

**If `ragMetadata` is not provided or is null:**
- `processWithRAG()` returns original prompt
- **Everything proceeds as normal**
- **No change to existing behavior**

### 3. Frontend: Add RAG UI (Optional)

```jsx
import RagSlashMenu from '@/components/rag/RagSlashMenu';
import RagSourceSelector from '@/components/rag/RagSourceSelector';
import RagContextPreview from '@/components/rag/RagContextPreview';

export default function ChatWindow() {
  const [ragSources, setRagSources] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const handleSendMessage = async () => {
    const payload = {
      chatId,
      prompt: messageText,
      // Only add RAG if sources selected
      ...(ragSources.length > 0 && { rag: { sources: ragSources } }),
    };

    const response = await fetch('/api/secondStage/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Continue as normal...
  };

  return (
    <>
      <RagSlashMenu isOpen={showSlashMenu} onSelect={handleSelectCommand} />
      <RagSourceSelector 
        selectedSources={ragSources} 
        onSourcesChange={setRagSources} 
      />
      <RagContextPreview results={ragResults} />
      {/* Your existing chat UI */}
    </>
  );
}
```

---

## 🔌 Integration Points

### Chat API: Already Integrated

The chat route at `src/app/api/secondStage/chat/route.js` has been **safely modified** to:

1. Detect optional `rag` metadata in request
2. Call `processWithRAG()` if metadata exists
3. Use augmented prompt for LLM
4. Return RAG metadata in response

**Zero breaking changes:**
- Old requests without `rag` field still work
- Behavior identical to before if `rag` not provided
- New responses include `rag` field only if RAG was used

### Example API Call (With RAG)

```bash
POST /api/secondStage/chat
{
  "chatId": "chat_123",
  "prompt": "How does spaced repetition work?",
  "rag": {
    "sources": ["flashcard", "note"]
  }
}
```

**Response:**
```json
{
  "content": "Spaced repetition is... [response grounded in your notes]",
  "chatId": "chat_123",
  "rag": {
    "enabled": true,
    "contextRetrieved": 3
  }
}
```

### Example API Call (Without RAG)

```bash
POST /api/secondStage/chat
{
  "chatId": "chat_123",
  "prompt": "How does spaced repetition work?"
}
```

**Response (identical to before RAG existed):**
```json
{
  "content": "Spaced repetition is...",
  "chatId": "chat_123"
}
```

---

## 📊 Data Flow: With & Without RAG

### Scenario: User Enables RAG

```
1. User types: "Explain spaced repetition"
2. User clicks: "/context-flashcard"
3. Frontend sends:
   {
     "chatId": "123",
     "prompt": "Explain spaced repetition",
     "rag": { "sources": ["flashcard"] }
   }

4. Backend receives RAG metadata ✓
   ├─ Calls processWithRAG()
   ├─ Embeds query: [0.123, 0.456, ...]
   ├─ Searches vector store for similar flashcards
   ├─ Finds: "Q: What's spaced repetition? A: ..."
   ├─ Augments prompt with context
   ├─ Sends to LLM: "## CONTEXT\n[flashcard]\n\n---\n\nExplain spaced..."

5. LLM generates response grounded in user's materials
6. Response saved to DB normally
```

### Scenario: Same User, RAG Disabled

```
1. User types: "Explain spaced repetition"
2. User just hits Enter (no slash command)
3. Frontend sends:
   {
     "chatId": "123",
     "prompt": "Explain spaced repetition"
   }

4. Backend receives NO RAG metadata ✓
   ├─ processWithRAG() returns original prompt
   ├─ Sends to LLM: "Explain spaced repetition"

5. LLM generates response
6. Response saved to DB normally
7. **Identical behavior to today**
```

---

## 🔧 Configuration

### Environment Variables (Already Required)

```bash
HUGGINGFACE_API_KEY=<your_token>        # For embedding model
SECONDARY_MONGODB_URI=<your_db_uri>    # For vector store
```

### RAG Defaults (Optional to Override)

In `src/components/rag/rag.constants.js`:

```javascript
export const RAG_CONFIG_DEFAULTS = {
  topK: 5,              // Max results to retrieve
  threshold: 0.3,       // Min similarity (0-1)
  enabled: true,        // Enable RAG system
};
```

---

## 📝 How to Add Content to RAG

When users create flashcards, notes, or quizzes, add them to the vector store:

### Example: Adding a Flashcard

```javascript
// In flashcard creation route:

import { addToVectorStore } from '@/lib/rag/index.js';

export async function POST(req) {
  // ... create flashcard in DB ...
  
  const flashcard = await createFlashcard({...});

  // Optionally add to RAG (graceful if it fails)
  await addToVectorStore({
    userId: user.id,
    sourceType: 'flashcard',
    sourceId: flashcard._id.toString(),
    text: `Q: ${flashcard.question}\nA: ${flashcard.answer}`,
    metadata: {
      tags: flashcard.tags.join(', '),
      difficulty: flashcard.difficulty,
    },
  });

  return { success: true, flashcard };
}
```

**Key point:** If embedding fails, the flashcard is still created. RAG is optional.

---

## 🗄️ Vector Store Schema

MongoDB collection: `rag_embeddings`

```json
{
  "_id": ObjectId,
  "userId": "user_123",
  "sourceType": "flashcard",
  "sourceId": "flashcard_456",
  "text": "Q: What is spaced repetition?\nA: A learning technique...",
  "embedding": [0.123, 0.456, ...],  // ~384 dimensions
  "metadata": {
    "tags": "memory, learning",
    "difficulty": "medium"
  },
  "createdAt": "2026-01-19T...",
  "updatedAt": "2026-01-19T..."
}
```

**Important:** This is a separate collection from your main data. Your original documents are unmodified.

---

## 🧠 RAG Modules Explained

### `embedder.js` - Text to Vector

Uses `sentence-transformers/all-MiniLM-L6-v2` (fast, lightweight embedding model)

```javascript
const embedding = await embedText("What is spaced repetition?");
// Returns: [0.123, -0.456, 0.789, ...]
```

### `vectorStore.js` - Vector Database

Stores embeddings and performs similarity search

```javascript
// Store
await storeEmbedding({
  userId, sourceType, sourceId, text, embedding, metadata
});

// Retrieve
// import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
const similar = await retrieveSimilar({
  userId, queryEmbedding, sourceTypes: RAG_CONTENT_TYPES, topK: 5
});
```

### `retriever.js` - Document Finder

High-level search orchestration

```javascript
// import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
const results = await retrieveContext({
  userId,
  query: "How does spaced repetition work?",
  sourceTypes: RAG_CONTENT_TYPES,
  topK: 5,
});
// Returns: { query, embedding, results, totalRetrieved }
```

### `promptBuilder.js` - Context Formatting

Converts retrieved documents into LLM-friendly format

```javascript
const augmentedPrompt = augmentPrompt({
  originalPrompt: "How does spaced repetition work?",
  retrievalResults: { results: [...] },
});
// Returns: "## CONTEXT\n[docs]\n\n---\n\nHow does..."
```

### `chunker.js` - Document Splitting

Breaks long documents into embedding-friendly chunks

```javascript
const chunks = chunkFlashcard({
  question: "What is X?",
  answer: "X is..."
});
// Returns: [{ text: "Q: What is X?\nA: X is...", metadata: {...} }]
```

---

## ✅ Testing RAG Integration

### 1. Health Check

```javascript
import { healthCheck } from '@/lib/rag/index.js';

const result = await healthCheck();
// {
//   healthy: true,
//   message: "RAG system is operational",
//   details: { embedding: true, vectorStore: true, errors: [] }
// }
```

### 2. Manual Retrieval Test

```javascript
import { retrieveContext } from '@/lib/rag/retriever.js';

// import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
const results = await retrieveContext({
  userId: 'test_user',
  query: 'What is spaced repetition?',
  sourceTypes: RAG_CONTENT_TYPES,
  topK: 3,
});

console.log(results);
// {
//   query: "What is spaced repetition?",
//   results: [
//     { sourceType: 'flashcard', text: '...', similarity: 0.94 },
//     { sourceType: 'flashcard', text: '...', similarity: 0.87 },
//     ...
//   ]
// }
```

### 3. API Test

```bash
curl -X POST http://localhost:3000/api/secondStage/chat \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test_chat",
    "prompt": "How does spaced repetition work?",
    "rag": {
      "sources": ["flashcard"]
    }
  }'

# Response should include:
# "rag": { "enabled": true, "contextRetrieved": N }
```

---

## 🚨 What's NOT Changed

**✓ Not changed:**
- All existing chat behavior
- Message storage in MongoDB
- LLM provider calls
- UI/UX unless explicitly using RAG
- Any existing API contracts
- Authentication or authorization

**✓ Files NOT modified:**
- `SECONDARY_ChatWindow.jsx` (no changes needed)
- `SECONDARY_providers.js` (no changes needed)
- `SECONDARY_db.js` (no changes needed)
- Any flashcard, quiz, or note components

**Only modified:**
- `src/app/api/secondStage/chat/route.js` (safe RAG detection)

---

## 🔮 Future Extensions

These are TODO comments in the code describing future RAG enhancements (NOT implemented yet):

1. **Video Transcripts** - Auto-extract and embed video transcripts
2. **Screen Recordings** - Capture and transcribe screen recordings
3. **Auto-Routing** - LLM decides which sources to retrieve
4. **Re-ranking** - Use LLM to re-rank results (better accuracy, slower)
5. **Citation Mode** - Track and cite sources
6. **Hybrid Search** - Combine vector search with keyword matching
7. **Feedback Loop** - Track helpful vs. unhelpful retrievals

These are extensions, not modifications to core RAG.

---

## 📚 Documentation

- **Backend RAG:** See [src/lib/rag/README.md](src/lib/rag/README.md)
- **Frontend UI:** See [src/components/rag/README.md](src/components/rag/README.md)
- **API Integration:** See modified `src/app/api/secondStage/chat/route.js`

---

## ✨ Summary

### What This Adds
- Optional RAG system for retrieving context from user's materials
- Slash commands for easy context selection
- Context preview before sending messages
- MongoDB-backed vector store for semantic search

### What This Doesn't Change
- Existing chat behavior (if RAG not used)
- Any existing files (except safe API integration)
- UI/UX (unless explicitly using RAG components)
- Authentication, database schema, or core logic

### Key Design Wins
1. **Non-breaking** - Existing code unmodified
2. **Optional** - Works with or without RAG
3. **Graceful degradation** - RAG errors don't break chat
4. **Extensible** - Easy to add video transcripts, citations, etc.
5. **Well-documented** - Plain English explanations in READMEs

---

**For questions or integration help, see the README files in `src/lib/rag/` and `src/components/rag/`.**
