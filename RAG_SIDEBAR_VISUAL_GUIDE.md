# RAG Sidebar UI - Visual Overview

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECONDARY_ChatWindow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────┐  │  ┌────────────────────────┐│
│  │                                          │  │  │   RAG Context Sidebar  ││
│  │  MESSAGES AREA (flex-1)                 │  │  │  (resizable: 200-600px)││
│  │  ┌────────────────────────────────────┐ │  │  │                        ││
│  │  │ User: Where is Cairo?              │ │  │  │ 🎯 RAG Context       ││
│  │  │                                    │ │  │  │ ─────────────────────  ││
│  │  │ Assistant: Cairo is the capital... │ │  │  │ 📝 Notes  🎴 Flashcard││
│  │  │ ✓                    ✓             │ │  │  │                        ││
│  │  │  Select for summary  (2 messages) │ │  │  │ Retrieved Context (3) ││
│  │  └────────────────────────────────────┘ │  │  │ ─────────────────────  ││
│  │                                          │  │  │                        ││
│  │  [Generate Summary] [Flashcards] [Quiz] │  │  │ 🎴 Egyptian Geography  ││
│  │                                          │  │  │     Cairo is in Egypt  ││
│  ├──────────────────────────────────────────┤  │  │     📊 Similarity: 92% ││
│  │ COMPOSER AREA (flex-shrink-0)           │  │  │     Tags: #geography   ││
│  │ ┌─ /context-note ──────────────────────┐ │  │  │                        ││
│  │ │ 📝 Notes                             │ │  │  │ 📝 The Nile River      ││
│  │ │ 🎴 Flashcards                        │ │  │  │     Flows through Cairo││
│  │ │ ❓ Quizzes                            │ │  │  │     📊 Similarity: 85% ││
│  │ │ 🎯 All Context Types                 │ │  │  │                        ││
│  │ └────────────────────────────────────┘ │  │  │ ❓ Cairo Founded        ││
│  │                                          │  │  │     ~5000 BC approx    ││
│  │ [📌] [Type message...      ] [Send ➤]  │  │  │     📊 Similarity: 78% ││
│  │                                          │  │  └────────────────────────┘│
│  └──────────────────────────────────────────┘  │                             │
│                                                 ↕ (resize handle)
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
SECONDARY_ChatWindow
│
├─ Main Content Container (flex row)
│  │
│  ├─ Left Panel (flex-1, min-w-0)
│  │  ├─ Messages Scrollable Area (flex-1)
│  │  │  ├─ System message: "Start a conversation..."
│  │  │  ├─ User message
│  │  │  ├─ Assistant message
│  │  │  │  ├─ ReactMarkdown (formatted)
│  │  │  │  └─ Selection checkbox
│  │  │  └─ ... more messages
│  │  │
│  │  └─ Composer Container (flex-shrink-0)
│  │     ├─ RagContextPreview (if ragResults.length > 0)
│  │     ├─ RagSourceSelector (if ragSources.length > 0)
│  │     └─ Input Area
│  │        ├─ RagSlashMenu (if showSlashMenu)
│  │        └─ ChatComposer (memoized input)
│  │
│  ├─ Resize Handle (1px divider, cursor-col-resize)
│  │
│  └─ RagContextSidebar (conditional)
│     ├─ Header
│     │  ├─ Title: "🎯 RAG Context"
│     │  └─ Collapse Toggle Button (›/‹)
│     │
│     └─ Content (if !isCollapsed)
│        ├─ Sources Section
│        │  └─ RagSourceBadges
│        │     ├─ 🎴 Flashcards
│        │     ├─ 📝 Notes
│        │     └─ ❓ Quizzes
│        │
│        └─ Results Section
│           ├─ Header: "Retrieved Context (3)"
│           │
│           └─ RagResultCard[]
│              ├─ RagResultCard
│              │  ├─ Icon + Type (🎴 flashcard)
│              │  ├─ Similarity Badge (92%)
│              │  ├─ Text Preview (3 lines)
│              │  └─ Metadata (tags, difficulty)
│              │
│              ├─ RagResultCard
│              ├─ RagResultCard
│              │
│              └─ Empty State (if no results)
│
├─ Selection Info Bar (if getSelectedCount() > 0)
│  └─ [Generate Summary] [Flashcards] [Quiz]
│
└─ Summary Dialog (if showSummaryDialog)
   └─ Dialog Content
```

## State Flow

```
User Input
    │
    ├─ Types "/" → showSlashMenu = true
    │  │
    │  └─ Select source → setRagSources(['flashcard'])
    │                    → Sidebar mounts & shows badge
    │
    ├─ Types message → composerText = "Where is Cairo?"
    │
    └─ Press Enter or Send
       │
       └─ API Call: /api/secondStage/chat
          │
          ├─ With RAG:
          │  ├─ Backend retrieves matching flashcards
          │  │  └─ Returns: { rag: { results: [{...}, {...}] } }
          │  │
          │  └─ Frontend: setRagResults(results)
          │
          └─ Sidebar updates:
             ├─ ragResults populated
             ├─ RagResultCard[] renders each result
             └─ Shows: similarity score, text, metadata
```

## Interactions

### 1. Collapse/Expand
```
User clicks › (collapse button)
  ↓
isCollapsed = true
  ↓
Sidebar shows only:
  - Badge count (🎯 3)
  - Collapse indicator (‹)
```

### 2. Resize
```
User drags left border (resize handle)
  ↓
onResizeStart() → isResizing = true
  ↓
document.addEventListener('mousemove')
  ↓
sidebarWidth constrained to 200-600px
  ↓
onMouseUp() → isResizing = false
```

### 3. Result Display
```
User sends message with RAG sources selected
  ↓
Backend retrieves documents
  ↓
API returns: { rag: { results: [{...}] } }
  ↓
setRagResults(results)
  ↓
RagContextSidebar renders cards
  ↓
Each RagResultCard shows:
  - 🎴 Source type
  - Text preview (3 lines)
  - 92% Similarity score
  - Tags & metadata
```

## Styling Reference

### Colors by Source Type
```
Flashcard 🎴   → bg-blue-500/20   border-blue-500/40   text-blue-300
Quiz ❓         → bg-purple-500/20 border-purple-500/40 text-purple-300
Note 📝        → bg-green-500/20  border-green-500/40  text-green-300

Add new types:
Video 🎥       → bg-red-500/20    border-red-500/40    text-red-300
PDF 📄         → bg-orange-500/20 border-orange-500/40 text-orange-300
```

### Spacing
```
Sidebar:
  - Default width: 320px
  - Min width: 200px
  - Max width: 600px
  - Padding: p-4 (16px)

Cards:
  - Gap between cards: gap-2
  - Card padding: p-3
  - Border radius: rounded-lg
```

## Future Types Example

```
To add VIDEO support:

1. Update content-types.js:
   export const RAG_CONTENT_TYPES = [..., 'video'];

2. Add icon mapping:
   video: { icon: '🎥', label: 'Videos', color: 'bg-red-500/20 ...' }

3. Sidebar auto-updates:
   ✅ Shows 🎥 Videos badge when selected
   ✅ Displays video results with icon
   ✅ No component changes needed!
```

## Key Features

✅ **Responsive Layout**
   - Messages stay full width when sidebar hidden
   - Sidebar emerges from right (320px default)
   - Resizable without affecting chat area

✅ **Collapsible**
   - Click › button to hide content
   - Shows compact badge + count
   - Click ‹ to expand again

✅ **Resizable**
   - Drag left border to adjust width
   - Min: 200px, Max: 600px
   - Smooth, real-time updates

✅ **Result Display**
   - Similarity scores (0-100%)
   - Text previews (3 lines max)
   - Metadata (tags, difficulty)
   - Sorted by relevance

✅ **Extensible**
   - Add new content types without code changes
   - Color-coded by type
   - Auto-generates icons and labels

✅ **Performance**
   - Conditional rendering (unmounts when hidden)
   - Independent scroll areas
   - Optimized re-renders
