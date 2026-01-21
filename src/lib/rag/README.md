// FILE: src/lib/rag/README.md
// DESCRIPTION: Plain-English guide to the RAG system
// PURPOSE: Explains the RAG implementation and how it integrates non-breakingly

# RAG System - Plain English Guide

## What is RAG?

**Retrieval Augmented Generation (RAG)** enhances AI responses by:
1. Finding relevant context from your study materials (flashcards, notes, quizzes)
2. Feeding that context to the LLM alongside your question
3. Getting responses grounded in your own materials

## Design Principle: Optional & Non-Breaking

This RAG system is **completely optional**. If you don't use it:
- The app works **exactly as before**
- No UI changes
- No logic changes
- No prompts for RAG

RAG only activates when you explicitly request context via a slash command.

## Architecture

```
User Question
    ↓
(Optional) User selects RAG context via slash command
    ↓
Chat API receives message + optional RAG metadata
    ↓
IF RAG metadata exists:
  ├─ Embed user query (convert to vector)
  ├─ Search vector store for similar documents
  ├─ Retrieve top results
  ├─ Augment prompt with context
ELSE:
  ├─ Skip all RAG (unchanged behavior)
  ↓
Call existing LLM (unchanged)
  ↓
Return response
```

## Core Modules

### `vectorStore.js` - Vector Database
**What it does:** Stores and retrieves document embeddings

- Stores embeddings in `rag_embeddings` MongoDB collection
- Calculates similarity between vectors using cosine distance
- Supports filtering by source type (flashcard, quiz, note, video)

**Key functions:**
- `storeEmbedding()` - Save a document embedding
- `retrieveSimilar()` - Find documents similar to a query
- `deleteEmbedding()` - Remove embeddings
- `listEmbeddings()` - Browse stored embeddings

### `embedder.js` - Text-to-Vector Converter
**What it does:** Converts text into vector embeddings using HuggingFace

- Uses `sentence-transformers/all-MiniLM-L6-v2` model (lightweight, fast)
- Calls HuggingFace Inference API
- Supports single text or batch embedding

**Key functions:**
- `embedText(text)` - Embed a single string
- `embedTexts(texts)` - Embed multiple strings (batch)

### `retriever.js` - Document Finder
**What it does:** Searches for relevant documents matching a query

- Embeds the user's query
- Searches the vector store
- Returns results sorted by relevance

**Key functions:**
- `retrieveContext()` - Main retrieval function
- `retrieveFromSource()` - Search specific source type
- `retrieveBySource()` - Get results grouped by source

### `promptBuilder.js` - Context Formatter
**What it does:** Converts retrieved documents into readable context for the LLM

- Formats results with similarity scores
- Groups by document type
- Provides compact or full formatting options

**Key functions:**
- `augmentPrompt()` - Add context to user message
- `augmentPromptCompact()` - Token-efficient augmentation
- `augmentSystemPrompt()` - Enhance system prompt

### `chunker.js` - Document Splitter
**What it does:** Breaks long documents into chunks for embedding

- Flashcards: Kept as single chunks (Q+A together)
- Notes: Split by paragraphs, ~500 chars per chunk
- Quizzes: Q+A+explanation combined
- Videos: Split by sentences

**Key functions:**
- `chunkFlashcard()` - Split flashcard
- `chunkNote()` - Split note
- `chunkQuizQuestion()` - Split quiz
- `chunkDocument()` - Route to appropriate chunker

### `index.js` - Main Entry Point
**What it does:** Orchestrates the RAG system

**Key functions:**
- `processWithRAG()` - Main function to enhance a prompt
- `addToVectorStore()` - Add document to vector DB
- `previewRAGResults()` - Show what RAG would retrieve
- `healthCheck()` - Verify RAG is working

## Integration Points

### Chat API: src/app/api/secondStage/chat/route.js

RAG integrates as an **optional pre-processing step**:

```javascript
// In chat route, BEFORE calling LLM:

if (ragMetadata) {
  // Optional: if user selected RAG via slash command
  const { augmentedPrompt } = await processWithRAG({
    userId: user.id,
    prompt: prompt,
    ragConfig: ragMetadata,
  });
  
  // Use augmented prompt instead of original
  messagesToSend[messagesToSend.length - 1].content = augmentedPrompt;
}

// Continue with existing LLM call (unchanged)
const providerResponse = await callProvider({
  provider,
  apiKey: null,
  messages: messagesToSend,
  stream,
  systemPrompt: customSystemPrompt,
});
```

If `ragMetadata` is not provided:
- `processWithRAG()` returns the original prompt
- Everything proceeds as normal
- **No change to existing behavior**

### UI: New Slash Command

A new slash menu shows when user types `/`:

```
/context-flashcard
/context-quiz
/context-note
```

Selecting one sends RAG metadata with the message:

```javascript
{
  message: "Explain spaced repetition",
  rag: {
    sources: ["flashcard"]
  }
}
```

If user doesn't select or closes menu:
- Message sent without RAG metadata
- Backend skips RAG entirely
- **Works exactly as before**

## Data Flow Example

### Scenario: User enables RAG for flashcards

1. **User types:** "How does spaced repetition work?"
2. **User selects:** `/context-flashcard`
3. **Frontend sends:**
   ```json
   {
     "chatId": "123",
     "prompt": "How does spaced repetition work?",
     "rag": { "sources": ["flashcard"] }
   }
   ```

4. **Backend processes:**
   - Receives `rag` metadata ✓ RAG enabled
   - Calls `processWithRAG()` with:
     - userId, prompt, ragConfig={sources: ["flashcard"]}
   - `retrieveContext()` embeds query
   - Searches vector store for flashcards
   - Finds: "Q: What's spaced repetition? A: A technique..."
   - `augmentPrompt()` creates:
     ```
     ## CONTEXT FROM YOUR NOTES
     
     ### Flashcards (1 item)
     **1. Relevance: 94%**
     Q: What's spaced repetition?
     A: A technique where you...
     
     ---
     
     How does spaced repetition work?
     ```
   - Calls LLM with augmented prompt
   - LLM sees context and gives better answer
   - Response saved normally

5. **Result:** Better answer grounded in user's notes

### Scenario: Same user, RAG disabled

1. **User types:** "How does spaced repetition work?"
2. **User sends message** (no `/context-` selection)
3. **Frontend sends:**
   ```json
   {
     "chatId": "123",
     "prompt": "How does spaced repetition work?"
   }
   ```

4. **Backend processes:**
   - No `rag` metadata ✓ RAG disabled
   - `processWithRAG()` returns original prompt
   - Calls LLM with original prompt
   - **Identical behavior to today**

## Vector Store Schema

```mongodb
// Collection: rag_embeddings

{
  _id: ObjectId,
  userId: string,           // Multi-tenant isolation
  sourceType: string,       // "flashcard" | "quiz" | "note" | "video"
  sourceId: string,         // Reference to original document
  text: string,             // The text that was embedded
  embedding: number[],      // Vector of ~384 dimensions
  metadata: {
    tags?: string,          // Comma-separated tags
    difficulty?: string,    // For flashcards
    type?: string,          // Redundant with sourceType, for convenience
    ...                      // Extensible for future metadata
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Adding Documents to RAG

When users create a flashcard, note, or quiz:

```javascript
// In flashcard creation route:

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
```

If embedding fails:
- **User's flashcard is still created** (original operation unaffected)
- Error logged for debugging
- RAG won't find this document, but app still works

## Future Extensions (TODO Comments)

The RAG system is designed to be extensible:

1. **Video Transcripts**: Auto-extract transcripts from videos, chunk, and embed
2. **Browser/Screen Recording**: Capture screen recordings, transcribe, index
3. **Auto-Routing**: If user doesn't select a source, LLM decides which type to retrieve
4. **Re-ranking**: Use LLM to re-rank retrieval results (more accurate but slower)
5. **Citation Mode**: Track source of each retrieved fact for citations
6. **Hybrid Search**: Combine vector search with keyword matching
7. **Feedback Loop**: Track which context was helpful to improve retrieval

## Disabling RAG

To completely disable RAG:

1. **Don't enable slash commands** - UI doesn't show `/context-` options
2. **Chat API**: Don't pass `rag` metadata
3. **No embedding calls** - Vector store stays empty
4. **Zero overhead** - Application functions identically to before RAG existed

## Limitations & Trade-offs

### Why cosine similarity in MongoDB?
- **Fast for small datasets** (<100K embeddings)
- **No external dependencies** (vs. Pinecone, Weaviate)
- **MongoDB Atlas Search** can replace for scale

### Why all-MiniLM-L6-v2?
- **Fast inference** (~50ms)
- **Small model** (22MB)
- **Good quality** for general use
- Can swap to other HuggingFace models as needed

### Why include full text in context block?
- **LLMs reason better** with full context vs. fragments
- **Users can verify** the source
- **Token cost** is manageable for 3-5 results

## Environment Variables

Required for RAG:

```
HUGGINGFACE_API_KEY=<your_hf_token>
SECONDARY_MONGODB_URI=<your_mongodb_connection>
```

Both already required for other features.

---

**Key Takeaway:** RAG is a feature layer that sits on top of existing functionality. Disabling it or not using it leaves the application completely unchanged.
