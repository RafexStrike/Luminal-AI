# RAG Context Sidebar - Quick Start Guide

## 🎯 What Is This?

The **RAG Context Sidebar** is a new right-side panel in the chat that displays:
- What RAG sources you've selected (flashcards, notes, quizzes)
- What content was retrieved to answer your question
- How similar each result is to your query (0-100%)

---

## 🚀 How to Use It

### 1. Open the Chat
Navigate to `/secondStage` in the app

### 2. Select a RAG Source
Type `/` in the message input to see available options:
```
/context-flashcard  → Search in flashcards
/context-note       → Search in notes
/context-quiz       → Search in quizzes
/context-all        → Search all sources
```

After selecting, you'll see badges appear on the right sidebar:
```
🎴 Flashcards
```

### 3. Send a Message
Type your question and send normally. For example:
```
"What is photosynthesis?"
```

### 4. View Results
The sidebar will populate with matching content:
```
┌─────────────────────────┐
│ 🎯 RAG Context          │
├─────────────────────────┤
│ 🎴 Flashcards           │
│                         │
│ Retrieved Context (3)   │
│                         │
│ 🎴 Photosynthesis Def   │
│    Is process where...  │
│    📊 Similarity: 96%   │
│    #biology #plants     │
│                         │
│ 🎴 Light Reactions      │
│    Part of photosyn...  │
│    📊 Similarity: 89%   │
└─────────────────────────┘
```

---

## 💡 Features

### Collapse/Expand
Click the `›` button to collapse:
```
┌──┐
│🎯│ ← Collapsed (badge shows)
│3 │
└──┘
```

Click `‹` to expand again.

### Resize
Hover over the left edge of the sidebar (resize cursor appears).  
Drag to adjust width between 200px and 600px.

### Source Badges
Shows what you're searching in:
- 🎴 **Flashcards** (blue)
- 📝 **Notes** (green)
- ❓ **Quizzes** (purple)

### Result Cards
Each result shows:
- **Source Type** (icon + name)
- **Similarity Score** (0-100%)
- **Text Preview** (first 3 lines)
- **Metadata** (tags, difficulty level)

---

## 📌 Tips & Tricks

### 1. Multiple Sources
Want to search all types at once?
```
Type: /context-all
Or: /
    Then select "All Context Types"
```

### 2. Result Filtering
Results are automatically sorted by similarity (highest first).  
Only very different results (below threshold) are hidden.

### 3. Collapsed View for Space
If you need more space for the chat:
```
Click › to collapse sidebar
Shows: 🎯 [count of results]
Click ‹ to expand again
```

### 4. Resize for Details
If you want to see longer text previews:
```
Drag the left edge to widen
Max width is 600px
```

---

## ⚙️ How It Works (Behind the Scenes)

### What Happens When You Send a Message with RAG

```
1. You select a source: /context-flashcard
   → ragSources = ['flashcard']
   → Sidebar appears

2. You type: "What is photosynthesis?"
   → Message sent to API

3. Backend:
   → Embeds your message into vector space
   → Searches MongoDB for similar flashcards
   → Returns matches with similarity scores

4. Frontend:
   → ragResults populated
   → Sidebar displays result cards
   → You see what the LLM will use as context

5. LLM responds:
   → Uses your message + retrieved context
   → Better, more grounded answer
   → Sidebar shows what content was used
```

### Data Structure

```javascript
ragSources: ['flashcard']  // What you selected
ragResults: [
  {
    sourceType: 'flashcard',
    text: 'Photosynthesis is...',
    similarity: 0.96,           // 0-1 scale (0-100%)
    metadata: {
      tags: ['biology', 'plants'],
      difficulty: 'medium'
    }
  },
  // ... more results
]
```

---

## 🐛 Troubleshooting

### Sidebar Not Appearing
**Problem:** I selected a source but no sidebar shows  
**Solution:**
1. Check that a source is selected (should show badge)
2. Try selecting `/context-all`
3. Send a message - sidebar appears after results arrive

### No Results in Sidebar
**Problem:** Sidebar shows but says "No matching content found"  
**Cause:** No documents in database match your query closely enough  
**Solution:**
1. Create more flashcards/notes/quizzes
2. Wait for them to be indexed
3. Try a more general query

### Sidebar is Too Narrow/Wide
**Problem:** Can't see full text in results  
**Solution:**
1. Hover over left edge (resize cursor appears)
2. Drag to adjust width (200-600px range)
3. Width is saved for your session

### Results Seem Off
**Problem:** Results don't match my query  
**Cause:** 
- Similarity threshold (default 0.3) filtering results
- Vector search working as designed (semantic match)
**Solution:**
1. Try different search terms
2. Check that content has been indexed
3. Results will improve as database grows

---

## 🔧 Customization

### For Developers

#### Change Default Sidebar Width
```javascript
// In SECONDARY_ChatWindow.jsx
const ragSidebarState = useRagSidebarState(400);  // 400px instead of 320px
```

#### Change Resize Constraints
```javascript
// In src/hooks/useRagSidebarState.js
const minWidth = 150;   // Changed from 200
const maxWidth = 800;   // Changed from 600
```

#### Add Custom Source Icon/Color
```javascript
// In src/components/rag/RagSourceBadges.jsx
const sourceIcons = {
  // ... existing ...
  video: {
    icon: '🎥',
    label: 'Videos',
    color: 'bg-red-500/20 border-red-500/40 text-red-300'
  }
};
```

---

## 📚 Documentation

For more details, see:
- **Full Technical Guide:** `src/components/rag/RAG_SIDEBAR_GUIDE.md`
- **Visual Diagrams:** `RAG_SIDEBAR_VISUAL_GUIDE.md`
- **Implementation Details:** `RAG_SIDEBAR_IMPLEMENTATION.md`

---

## ✨ What's Next?

Planned improvements:
- [ ] Mobile-friendly bottom drawer version
- [ ] Save sidebar width to preferences
- [ ] Click result cards to expand/copy
- [ ] Filter results by type
- [ ] Sort options (similarity, date, etc.)
- [ ] Analytics (which sources most useful)

---

## 🎓 Examples

### Example 1: Learning Biology
```
Query: /context-flashcard
Input: "Explain cellular respiration"

Output:
├─ Flashcard: Glycolysis Definition (92% match)
├─ Flashcard: ATP Energy Production (87% match)
└─ Flashcard: Mitochondria Function (84% match)

LLM uses all 3 to give detailed, accurate answer
```

### Example 2: Multi-source Learning
```
Query: /context-all
Input: "What are the causes of WW2?"

Output:
├─ 📝 Note: European Economic Crisis (95% match)
├─ 🎴 Flashcard: Treaty of Versailles (92% match)
├─ ❓ Quiz: Territorial Disputes (88% match)
└─ 🎴 Flashcard: Rise of Fascism (82% match)

LLM synthesizes all sources for comprehensive answer
```

---

## 📞 Support

If something isn't working:
1. Check the troubleshooting section above
2. Review the full guide: `RAG_SIDEBAR_GUIDE.md`
3. Check browser console for errors
4. Verify your documents are in the database

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** January 22, 2026
