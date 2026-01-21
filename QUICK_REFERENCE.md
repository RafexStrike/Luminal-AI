# RAG System - Quick Reference

## 🎯 What's New

A **Retrieval Augmented Generation (RAG)** system that lets users select context from their materials (flashcards, notes, quizzes) to enhance LLM responses.

## ✅ Core Guarantee

**If RAG is not used, the app works exactly as before.**

## 📁 New Files (12 total)

### Backend (`src/lib/rag/`)
```
vectorStore.js       - MongoDB vector database
embedder.js          - HuggingFace embeddings  
retriever.js         - Document search
promptBuilder.js     - Context formatting
chunker.js           - Document splitting
index.js             - Main orchestration
README.md            - Backend docs
```

### Frontend (`src/components/rag/`)
```
RagSlashMenu.jsx       - Slash command menu
RagSourceSelector.jsx  - Source picker
RagContextPreview.jsx  - Context display
rag.constants.js       - Configuration
README.md              - UI docs
```

### Documentation (4 files)
```
RAG_IMPLEMENTATION.md          - Main guide
RAG_CHAT_INTEGRATION.md        - ChatWindow integration
RAG_IMPLEMENTATION_SUMMARY.md  - This summary
QUICK_REFERENCE.md             - This file
```

## 🚀 Quick Usage

### Backend
```javascript
import { processWithRAG } from '@/lib/rag/index.js';

// In chat route
if (ragMetadata) {
  const { augmentedPrompt } = await processWithRAG({
    userId: user.id,
    prompt: userMessage,
    // import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
ragConfig: { sources: RAG_CONTENT_TYPES }
  });
  // Use augmentedPrompt instead of original
}
```

### API
```bash
# Without RAG (works as before)
POST /api/secondStage/chat
{ "chatId": "123", "prompt": "..." }

# With RAG (new)
POST /api/secondStage/chat
{ 
  "chatId": "123", 
  "prompt": "...",
  "rag": { "sources": ["flashcard"] }
}
```

### Frontend
```jsx
import RagSlashMenu from '@/components/rag/RagSlashMenu';

// Show slash menu when user types /
if (text.startsWith('/')) {
  <RagSlashMenu isOpen onSelect={handleSelect} />
}

// Send with RAG
fetch('/api/secondStage/chat', {
  body: JSON.stringify({
    chatId,
    prompt,
    rag: { sources: selectedSources }
  })
})
```

## 🔧 Setup

### Environment (already required)
```bash
HUGGINGFACE_API_KEY=...
SECONDARY_MONGODB_URI=...
```

### Embedding Model
- Uses: `sentence-transformers/all-MiniLM-L6-v2`
- Size: ~22MB
- Speed: ~100ms per query

### Vector Store
- MongoDB collection: `rag_embeddings`
- Schema: `{ userId, sourceType, sourceId, text, embedding, metadata }`

## 📊 Data Flow

```
User types "/" → See slash menu → Select source → Send
                                                     ↓
                                          Backend detects RAG
                                                     ↓
                                          Embed query
                                                     ↓
                                          Search vector DB
                                                     ↓
                                          Format context
                                                     ↓
                                          Augment prompt
                                                     ↓
                                          Call LLM
                                                     ↓
                                          Response (with context)
```

## 🎮 User Experience

### Scenario 1: Normal Chat
```
Type: "What is X?"
Press: Enter
Result: Normal response (no changes)
```

### Scenario 2: Chat with Context
```
Type: "/"
See: [Flashcards] [Quizzes] [Notes] [All Sources]
Select: "Flashcards"
Type: "What is X?"
Press: Enter
Result: Response grounded in your flashcards
```

## 🔌 Module Breakdown

| Module | Purpose | Key Function |
|--------|---------|--------------|
| `embedder.js` | Text → Vector | `embedText(text)` |
| `vectorStore.js` | Store & search vectors | `retrieveSimilar(...)` |
| `retriever.js` | Find relevant docs | `retrieveContext(...)` |
| `promptBuilder.js` | Format context | `augmentPrompt(...)` |
| `chunker.js` | Split documents | `chunkFlashcard(...)` |
| `index.js` | Orchestration | `processWithRAG(...)` |

## 🛡️ Non-Breaking Guarantees

✅ No existing files renamed
✅ No existing files moved
✅ No existing APIs changed
✅ No existing UI modified
✅ Old requests work identically
✅ Graceful fallback on RAG error
✅ Optional: don't use if you don't want

## 🚀 Integration (30 minutes)

1. **Backend:** Already integrated in chat API
2. **Frontend:** Add RAG components to ChatWindow
   - Import 3 components
   - Add 6 state variables
   - Update input handler
   - Modify send handler
   - Render components

See `RAG_CHAT_INTEGRATION.md` for code.

## 📝 Adding Documents to RAG

```javascript
await addToVectorStore({
  userId: user.id,
  sourceType: 'flashcard',
  sourceId: flashcard._id.toString(),
  text: `Q: ${flashcard.question}\nA: ${flashcard.answer}`,
  metadata: { tags, difficulty }
});
```

## 🧪 Testing

```javascript
// Health check
import { healthCheck } from '@/lib/rag/index.js';
const result = await healthCheck();
console.log(result); // { healthy: true/false, ... }

// Manual retrieval
import { retrieveContext } from '@/lib/rag/retriever.js';
// import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
const results = await retrieveContext({
  userId: 'test',
  query: 'What is X?',
  sourceTypes: RAG_CONTENT_TYPES,
  topK: 5
});
console.log(results);
```

## 🔮 Future (Not Implemented)

- Video transcripts → RAG
- Screen recordings → RAG
- Auto-routing (LLM decides source)
- Re-ranking with LLM
- Citation tracking
- Hybrid search (vector + keyword)

See code TODO comments for details.

## 📚 Documentation

| Document | For | Duration |
|----------|-----|----------|
| `RAG_IMPLEMENTATION.md` | Overview | 10 min read |
| `RAG_CHAT_INTEGRATION.md` | Integration | 20 min read + code |
| `src/lib/rag/README.md` | Backend details | 15 min read |
| `src/components/rag/README.md` | UI details | 15 min read |
| `QUICK_REFERENCE.md` | This! | 5 min read |

## 🎯 Success = 

```
✅ Existing app works exactly as before
✅ RAG components integrate without breaking
✅ Users can optionally use RAG via slash command
✅ Context-enhanced responses when RAG enabled
✅ Graceful fallback if RAG fails
```

---

**Next Step:** Read `RAG_CHAT_INTEGRATION.md` to add RAG to your chat interface.
