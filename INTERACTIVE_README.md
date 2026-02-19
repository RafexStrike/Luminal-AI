# INTERACTIVE Explainer Feature

A modular `@interactive` feature that generates validated JSON explainer specs via HuggingFace Inference and renders them as step-through interactive UIs in the chat window.

---

## Files Created

| File | Description |
|------|-------------|
| `src/app/api/interactive/INTERACTIVE_route.js` | POST `/api/interactive/generate` endpoint |
| `src/lib/interactive/INTERACTIVE_generator.js` | Orchestrator: RAG → prompt → HF → validate |
| `src/lib/interactive/INTERACTIVE_promptBuilder.js` | Strict system+user prompt builder |
| `src/lib/interactive/INTERACTIVE_schema.js` | AJV schema + `validateInteractiveSpec()` |
| `src/lib/interactive/INTERACTIVE_bundleBuilder.js` | HTML bundle sanitiser (bundle mode) |
| `src/lib/interactive/INTERACTIVE_ragHelper.js` | RAG context fetcher (thin wrapper) |
| `src/components/interactive/INTERACTIVE_InteractiveExplainer.jsx` | Main spec renderer (steps + KB + nav) |
| `src/components/interactive/INTERACTIVE_StepCard.jsx` | One-step presentational card |
| `src/components/interactive/INTERACTIVE_KBList.jsx` | Knowledge-base chunk list |
| `src/components/interactive/INTERACTIVE_IframeSandbox.jsx` | Sandboxed iframe for HTML bundles |
| `src/components/interactive/INTERACTIVE_PanelModal.jsx` | Panel listing generated interactives |
| `src/components/interactive/INTERACTIVE_ChatResultCard.jsx` | Chat-thread status card (pending/success/error) |
| `src/hooks/INTERACTIVE_useInteractiveMode.js` | `@interactive` detection + API lifecycle hook |
| `tests/interactive/INTERACTIVE_schema.test.js` | Schema unit tests |
| `tests/interactive/INTERACTIVE_generator.test.js` | Generator integration tests (mocked HF) |
| `tests/components/INTERACTIVE_InteractiveExplainer.test.jsx` | Component render + navigation tests |
| `scripts/INTERACTIVE_devSeed.js` | Dev seed script (prints sample spec) |

---

## Running Locally

```bash
# Start dev server
npm run dev

# Test API endpoint (requires dev server running)
curl -X POST http://localhost:3000/api/interactive/generate \
  -H "Content-Type: application/json" \
  -d '{"query":"@interactive how RAG works","title":"How RAG Works","mode":"spec"}'
```

---

## Dev Seed (no server needed)

```bash
node scripts/INTERACTIVE_devSeed.js
```

Outputs `INTERACTIVE: seeded sample spec` followed by a complete valid JSON spec you can copy into component tests.

---

## Running Tests

> [!NOTE]
> Tests require Jest + @testing-library/react. Install dev deps first if not already present:
> ```bash
> npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom babel-jest
> ```

```bash
# Schema unit tests (pure Node — fastest)
npx jest tests/interactive/INTERACTIVE_schema.test.js

# Generator integration tests (mocked HF + RAG)
npx jest tests/interactive/INTERACTIVE_generator.test.js

# Component render + navigation tests
npx jest tests/components/INTERACTIVE_InteractiveExplainer.test.jsx

# Run all INTERACTIVE tests at once
npx jest tests/interactive/ tests/components/INTERACTIVE_InteractiveExplainer.test.jsx
```

---

## How to generate an interactive from the chat UI

1. In the chat composer, type: `@interactive <topic>` (e.g. `@interactive how RAG works`)
2. The `INTERACTIVE_useInteractiveMode` hook detects the `@interactive` trigger
3. Call `generate({ query, title })` with the extracted values
4. A `INTERACTIVE_ChatResultCard` with **pending** state appears in the thread
5. On success, it shows **Ready** + an **Open** button
6. Clicking **Open** renders `INTERACTIVE_InteractiveExplainer` with the validated spec
7. Use **Next / Prev** or **Arrow keys** to navigate steps; **ESC** closes

---

## API Contract

**POST** `/api/interactive/generate`

**Request:**
```json
{ "query": "@interactive how RAG works", "title": "How RAG Works", "mode": "spec" }
```

**Success response (`spec` mode):**
```json
{ "kind": "spec", "payload": { "type": "interactive_explainer", "version": "1.0", ... } }
```

**Error response:**
```json
{ "kind": "error", "payload": { "message": "...", "details": ["..."], "debugHint": "INTERACTIVE: logged full LLM output..." } }
```

---

## Logging

All log output is prefixed with `INTERACTIVE:` for easy filtering:

```bash
# In dev server terminal, filter interactive logs:
npm run dev 2>&1 | grep INTERACTIVE
```

Key lifecycle log messages:
- `INTERACTIVE: request received` — API route entry
- `INTERACTIVE: generator entered [id]` — generator start  
- `INTERACTIVE: fetchRAGSnippets called` — RAG retrieval
- `INTERACTIVE: prompt built` — prompt ready
- `INTERACTIVE: calling HF inference` — before API call
- `INTERACTIVE: returning valid spec` — success path
- `INTERACTIVE ERROR: validation failed` — schema errors
- `INTERACTIVE ERROR: JSON parse failed after retry` — model output unparseable

---

## Security

- Model-produced HTML bundles are **never** rendered in the main document.
- `INTERACTIVE_bundleBuilder` strips `<script src>` from unapproved hosts and injects a strict CSP meta tag.
- `INTERACTIVE_IframeSandbox` renders bundles in a `sandbox="allow-scripts"` iframe only, with `allow-same-origin` intentionally omitted.
