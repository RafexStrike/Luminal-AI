# Revise From Context API

Category-scoped revision chat powered by RAG retrieval over the user's study materials.

## Architecture

This subsystem uses **ragDB** (a separate MongoDB database) for sessions and chat history. It reads pre-embedded vectors from `rag_embeddings` (via `SECONDARY_MONGODB_URI`) but **never creates new embeddings** from Revise chat messages.

## Endpoints

### `POST /api/secondStage/reviseFromContext/generate`

Generate a context-grounded answer.

```bash
curl -X POST http://localhost:3000/api/secondStage/reviseFromContext/generate \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "cloud",
    "mode": "QA",
    "query": "Explain S3 eventual consistency",
    "topK": 6,
    "strictMode": true
  }'
```

**Response (OK):**
```json
{
  "status": "OK",
  "answer": "...",
  "explanation_steps": ["..."],
  "sources": [{"source_type":"chat","source_id":"chat:abc","similarity":0.92}],
  "context_strength": "strong",
  "confidence": 0.78
}
```

**Response (INSUFFICIENT_CONTEXT):**
```json
{
  "status": "INSUFFICIENT_CONTEXT",
  "reason": "No supporting chunks found in the selected category",
  "suggestion": "Upload notes or mark relevant chats under this category."
}
```

---

### `GET /api/secondStage/reviseFromContext/sessions?categoryId=cloud`

List all Revise sessions for the authenticated user + category.

```bash
curl "http://localhost:3000/api/secondStage/reviseFromContext/sessions?categoryId=cloud"
```

---

### `POST /api/secondStage/reviseFromContext/sessions`

Create a new session.

```bash
curl -X POST http://localhost:3000/api/secondStage/reviseFromContext/sessions \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"cloud","name":"Finals review session"}'
```

---

### `GET /api/secondStage/reviseFromContext/sessions/:id/history`

Get full message history for a session.

```bash
curl "http://localhost:3000/api/secondStage/reviseFromContext/sessions/abc123/history"
```

---

### `POST /api/secondStage/reviseFromContext/sessions/:id/message`

Post a user message and get agent reply. Both are persisted but **not embedded**.

```bash
curl -X POST http://localhost:3000/api/secondStage/reviseFromContext/sessions/abc123/message \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "cloud",
    "query": "What is S3 eventual consistency?",
    "mode": "QA",
    "strictMode": false
  }'
```

## Collections (ragDB)

| Collection | Purpose |
|---|---|
| `revise_sessions` | `{ sessionId, userId, categoryId, name, createdAt }` |
| `revise_chat_history` | `{ sessionId, sender, text, timestamp, meta }` — no embeddings |
| `exemplars` | Optional structured output archiving |
| `metrics` | Optional request/response logging |

## Key Constraints

1. **No LuminalDB modifications** — this subsystem is fully independent
2. **No embedding of Revise messages** — chat history is stored as plain documents
3. **Namespace scoping** — all retrieval uses `user_{userId}:{categoryId}`
4. **Strict Mode** — when ON, refuses to answer without supporting context
