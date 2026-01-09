// FILE: src/app/secondStage/INTEGRATION_GUIDE.md
// Quick integration guide for stage-2 feature (non-code document)

# Stage-2 Learning UI - Integration Guide

## Files Generated
- **15 new files total** under `src/app/secondStage/`, `src/components/`, and `src/lib/`
- All prefixed with `SECONDARY_` for easy identification
- Zero modifications to existing repo files

## Immediate Setup (5 minutes)

### 1. Set Environment Variables
Create `.env.local`:
```bash
# MongoDB (required for saving data)
SECONDARY_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/youlearn?retryWrites=true&w=majority

# Pick one LLM provider
OPENAI_API_KEY=sk-...
# OR
GROQ_API_KEY=gsk_...
# OR
HUGGINGFACE_API_KEY=hf_...
```

### 2. Replace Auth Placeholder
File: `src/lib/SECONDARY_authPlaceholder.js`

```js
// BEFORE (placeholder):
export async function getUserIfAuthenticated(req) {
  return null; // Always anonymous
}

// AFTER (your auth):
import { getServerSession } from "next-auth";
import { authOptions } from "@/your/auth/file"; // YOUR_AUTH_MIDDLEWARE

export async function getUserIfAuthenticated(req) {
  const session = await getServerSession(authOptions);
  return session?.user ? { id: session.user.id } : null;
}
```

### 3. Test the Feature
```bash
npm run dev
# Visit http://localhost:3000/secondStage
```

## Features Ready to Use

✅ Chat interface with message composer  
✅ Message selection & summary generation (normal + incremental JSON)  
✅ Flashcard generation & display  
✅ Quiz generation with answer checking  
✅ Notes editor with local/server save  
✅ Sidebar collapse (persisted)  
✅ Responsive UI with Tailwind  

## Features Needing Configuration

⚙️ **Authentication** → Update getUserIfAuthenticated()  
⚙️ **Database** → Set SECONDARY_MONGODB_URI env var  
⚙️ **Provider Keys** → Set OPENAI_API_KEY, GROQ_API_KEY, or HUGGINGFACE_API_KEY  
⚙️ **Streaming** → Uncomment `stream: true` in chat route when ready  
⚙️ **File Upload** → Implement upload handlers in TopHero component  

## Data Persistence

| Feature | Local? | Server? | Auth Required? |
|---------|--------|---------|---|
| Chat messages | ✓ | ✓ | Yes |
| Summaries | ✗ | ✓ | Yes |
| Flashcards | ✗ | ✓ | Yes |
| Quizzes | ✗ | ✓ | Yes |
| Notes | ✓ | ✓ | Server save only |

## API Endpoints

```
POST   /api/secondStage/chat              → LLM response
POST   /api/secondStage/summary           → Summary generation
POST   /api/secondStage/flashcards        → Flashcard generation
POST   /api/secondStage/quizzes           → Quiz generation
GET    /api/secondStage/notes             → Load notes
POST   /api/secondStage/notes             → Save notes (auth required)
```

## Default Behaviors

- **Sidebar collapse**: Stored in localStorage as `youlearn_stage2_sidebar_collapsed`
- **Provider selection**: Currently hardcoded to "openai", customizable via settings
- **Anonymous mode**: Works for generation, blocks server saves (returns 401)
- **Streaming**: Placeholder framework ready, set `stream: true` to enable

## Troubleshooting

**"SECONDARY_MONGODB_URI not set"**
→ Add to .env.local and restart dev server

**"API error: 401"**
→ Check auth middleware; anonymous users blocked from save operations

**"Failed to parse LLM response as JSON"**
→ Provider returned non-JSON; check API key and model support

**Messages not appearing**
→ Check browser console for fetch errors; verify chat route is accessible

## File Structure Reference

```
src/
├── app/
│   ├── secondStage/
│   │   └── page.jsx
│   └── api/secondStage/
│       ├── chat/route.js
│       ├── summary/route.js
│       ├── flashcards/route.js
│       ├── quizzes/route.js
│       └── notes/route.js
├── components/
│   ├── SECONDARY_ChatLayout.jsx
│   ├── SECONDARY_ChatSidebar.jsx
│   ├── SECONDARY_ChatWindow.jsx
│   ├── SECONDARY_TopHero.jsx
│   ├── SECONDARY_FlashcardsPanel.jsx
│   ├── SECONDARY_QuizzesPanel.jsx
│   └── SECONDARY_NotesPanel.jsx
└── lib/
    ├── SECONDARY_authPlaceholder.js
    ├── SECONDARY_providers.js
    └── SECONDARY_db.js
```

## Questions?

- Check inline code comments (every function has JSDoc)
- See SECONDARY_STAGE2_SETUP.md for detailed integration notes
- Review API routes for expected request/response formats
- Check browser console for runtime errors
