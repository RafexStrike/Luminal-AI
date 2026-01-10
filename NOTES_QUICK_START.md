# Notion-like Notes Feature - Quick Start Guide

## What's New

A full-featured, Notion-like rich text editor integrated into the Luminal platform with:
- ✅ Slash commands (/) for inserting blocks
- ✅ Formatting toolbar (bold, italic, headings, lists, quotes, code, dividers)
- ✅ Auto-save to localStorage every 2 seconds
- ✅ Server persistence (requires authentication)
- ✅ Export functionality
- ✅ Character count tracking

## Getting Started

### 1. Access Notes

Navigate to: `http://localhost:3000/secondStage`

Click the **"Notes"** tab (should be visible alongside Chat, Flashcards, and Quizzes tabs)

### 2. Start Typing

- Type directly in the editor
- Notice the placeholder: "Type '/' for commands, or start typing..."
- Your content auto-saves to browser every 2 seconds

### 3. Use Slash Commands

Press `/` to open the slash command menu:

```
/heading   → Insert headings (H1, H2, H3)
/bullet    → Bullet list
/number    → Numbered list
/quote     → Block quote
/code      → Code block
/divider   → Horizontal line
```

Examples:
- Type `/h1` and press Enter → Creates H1 heading
- Type `/bullet` and press Enter → Starts bullet list
- Type `/code` and press Enter → Creates code block
- Type `/quote` and press Enter → Creates quote

Navigation:
- Arrow Up/Down: Move through suggestions
- Enter: Select highlighted command
- Escape: Close menu

### 4. Use Formatting Toolbar

Located above the editor:

**Text Formatting:**
- Click **B** for Bold (or Ctrl+B)
- Click *I* for Italic (or Ctrl+I)
- Click ~~S~~ for Strikethrough
- Click `<>` for Inline Code

**Block Types:**
- Click P for Paragraph
- Click H1/H2/H3 for Headings

**Lists:**
- Click • for Bullet List
- Click 1. for Numbered List

**Special:**
- Click ❝ for Quote
- Click {} for Code Block
- Click — for Divider

Active buttons turn blue when formatting is applied.

### 5. Save to Server

1. Click the **"Save to Server"** button (blue button with 💾)
2. Wait for "✓ Saved to server" confirmation
3. Last saved time displays in header
4. Note: Requires authentication (must be logged in)

### 6. Export Notes

1. Click the **"Export"** button (purple button with 📥)
2. File downloads as `notes_[timestamp].txt`
3. Contains your note content in text format

## Features Explained

### Local Auto-Save
- Automatically saves every 2 seconds
- Stored in browser's localStorage
- Survives page reload
- Persists across sessions until cleared

### Server Persistence
- Manual save required (click button)
- Requires login (anonymous users can edit but cannot save)
- Saves to MongoDB
- Shared across devices if logged in
- Shows timestamp of last server save

### Rich Formatting
- HTML-based storage (Tiptap format)
- Supports bold, italic, strikethrough, code, headings, lists, quotes, blocks
- Preserves formatting across saves
- Character count tracks all text

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | Ctrl+B |
| Italic | Ctrl+I |
| Open Slash Menu | / |
| Close Menu | Escape |
| Navigate Menu | Arrow Up/Down |
| Select Command | Enter |

## Architecture

### Components
- **SECONDARY_NotesPanel.jsx** - Container managing notes state
- **SECONDARY_TiptapEditor.jsx** - Rich editor with toolbar and slash commands

### Data Flow
1. User edits in Tiptap editor
2. onChange callback captures HTML
3. setContent updates local state
4. Auto-save timer fires every 2 seconds
5. Saves to localStorage as JSON
6. Manual "Save to Server" posts to API
7. API saves to MongoDB (if authenticated)
8. Success feedback shown to user

### Storage Locations
- **Local:** `youlearn_stage2_notes` in localStorage
- **Server:** `stage2_notes` MongoDB collection (if authenticated)

## API Integration

### Save to Server
```javascript
POST /api/secondStage/notes
Content-Type: application/json

{
  "content": "<p>HTML formatted content from Tiptap</p>"
}

Response:
{
  "success": true,
  "updatedAt": "2026-01-10T12:34:56.789Z"
}
```

### Load from Server
```javascript
GET /api/secondStage/notes

Response:
{
  "content": "<p>HTML formatted content</p>",
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T12:34:56.789Z"
}
```

### Authentication Required
- GET: Works for all (empty if not authenticated)
- POST: Requires authentication (401 if not logged in)

## Common Tasks

### Create a Study Guide
1. Type `/h1` → Create title
2. Add content with formatting
3. Use `/bullet` for key points
4. Use `/code` for code examples
5. Use `/quote` for important definitions
6. Click "Save to Server" when done

### Take Meeting Notes
1. Type `/h1` → Date and topic
2. Use `/bullet` for action items
3. Use `/quote` for important statements
4. Type `/divider` between sections
5. Auto-saves locally every 2 seconds

### Create Code Snippets
1. Type `/code` to create code block
2. Paste or type your code
3. Use inline code (`) for variable names
4. Type `/divider` between snippets
5. Save to server for persistence

### Organize with Headers
```
/h1 Main Topic
Content here
/h2 Subtopic 1
Details
/h3 Detail Point
More info
```

## Styling

### Visual Feedback
- **Active formatting:** Blue background on toolbar
- **Hover effects:** Gray background on buttons
- **Status messages:** Green success, red error
- **Menu selection:** Blue highlight

### Responsive
- Adapts to container size
- Mobile-friendly touch targets
- Works on desktop and tablet
- Full-featured on all devices

## Browser Storage

### localStorage Usage
- **Key:** `youlearn_stage2_notes`
- **Size:** ~5-10MB per site (browser dependent)
- **Format:** JSON with content and timestamp

### Clear Data
To reset notes (in browser console):
```javascript
localStorage.removeItem('youlearn_stage2_notes');
```

## Database Schema

Collection: `stage2_notes`
```javascript
{
  _id: ObjectId,
  userId: string,           // User's ID (from auth)
  content: string,          // HTML from Tiptap
  createdAt: Date,          // When created
  updatedAt: Date           // Last modification
}
```

## Limitations & Future

### Current Limitations
- No version history (use browser undo/redo)
- No collaboration (single user per note document)
- No image uploads (can be added via Tiptap)
- No search functionality
- No tags or categories

### Planned Enhancements
- Image/media support
- Note templates
- Search and tagging
- Version history
- Collaboration features
- Dark mode
- Export to Markdown/PDF
- Note categories

## Troubleshooting

### Notes Won't Save
- ✓ Is autosave indicator showing? (Check footer)
- ✓ Is localStorage enabled? (Check browser settings)
- ✓ Logged in? (Need auth for server save)
- ✓ Check browser console (F12 → Console) for errors

### Slash Menu Not Opening
- Type `/` (forward slash)
- Make sure cursor is in editor
- Check console for React errors
- Refresh page if stuck

### Formatting Not Appearing
- Select text first
- Click toolbar button or use shortcut
- Check that button turns blue (indicating active)
- Refresh browser if formatting disappears

### Character Count Wrong
- Count includes HTML tags in internal format
- Display count shows visible characters
- Counts whitespace and line breaks

### Lost Data
- Check localStorage (browser storage survives reload)
- Data persists across sessions unless cleared
- If browser crashed: localStorage should still have data
- To restore: Refresh page, notes should reload

## Performance Tips

- Notes auto-save every 2 seconds (not real-time)
- Works smoothly with 10,000+ characters
- Slash menu filters instantly
- No lag with typical note-taking

## Security Considerations

- All content stored locally first
- Server save requires authentication
- MongoDB used for server storage
- No end-to-end encryption (SSL if using HTTPS)
- Treat sensitive data appropriately

## Integration with Other Features

### Use with Flashcards
1. Take notes in Notes tab
2. Select key concepts
3. Switch to Flashcards tab
4. Generate flashcards from notes

### Use with Quizzes
1. Write comprehensive notes
2. Use slash commands to organize
3. Create study guide structure
4. Generate quiz questions from notes

### Sync with Chat
- Notes are independent from chat
- Can reference chat topics in notes
- No automatic linking (manual copy-paste)
- Useful for alongside conversations

## Support & Help

For issues:
1. Check this guide first
2. Review browser console (F12)
3. Verify MongoDB connection
4. Check authentication status
5. Try clearing localStorage
6. Restart dev server

## Summary

The Notes feature provides a powerful, Notion-like experience for note-taking with:
- Rich formatting and structure
- Intuitive slash commands
- Automatic local saving
- Optional server persistence
- Export capability
- Character tracking

Start taking notes now: **Click the Notes tab!**

---

**Version:** 1.0  
**Last Updated:** January 10, 2026  
**Status:** ✅ Ready to Use
