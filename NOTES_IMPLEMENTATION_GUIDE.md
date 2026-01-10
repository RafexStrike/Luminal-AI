# Notes Feature Implementation Guide

## Overview

A Notion-like rich text editor built with Tiptap for the Luminal platform. Supports slash commands, formatting toolbar, auto-save, and server persistence.

## Architecture

### Components

**SECONDARY_TiptapEditor.jsx**
- Rich text editor with Tiptap
- Formatting toolbar (bold, italic, headings, lists, quotes, code, dividers)
- Slash command menu (/) for block insertion
- Auto-triggered on typing `/`
- Keyboard navigation (arrow keys, Enter to select, Escape to close)
- Character count display

**SECONDARY_NotesPanel.jsx**
- Container component managing notes state
- Auto-save to localStorage every 2 seconds
- Server persistence via `/api/secondStage/notes`
- Export functionality (download as text)
- Last saved timestamp
- Save status feedback

### API Endpoints

**POST /api/secondStage/notes**
- Save notes to MongoDB
- Requires authentication
- Accepts HTML content from Tiptap
- Returns: `{ success: true, updatedAt: ISO string }`

**GET /api/secondStage/notes**
- Retrieve user's saved notes
- Returns: `{ content: HTML, createdAt: ISO, updatedAt: ISO }`
- Anonymous users get empty content

### Database

Collection: `stage2_notes`

Schema:
```javascript
{
  _id: ObjectId,
  userId: string,
  content: string,           // HTML from Tiptap
  createdAt: Date,
  updatedAt: Date
}
```

Stored functions:
- `saveNotes({ userId, content })` - Create or update notes
- `getNotes({ userId })` - Retrieve user notes

## Features

### Slash Commands

Triggered by typing `/` anywhere in the editor:

- **Headings**
  - Heading 1 (large)
  - Heading 2 (medium)
  - Heading 3 (small)

- **Lists**
  - Bullet List (unordered)
  - Numbered List (ordered)

- **Block Elements**
  - Quote (blockquote)
  - Code Block (multi-line code)
  - Divider (horizontal rule)

Navigation:
- Arrow Up/Down: Move through suggestions
- Enter: Select highlighted command
- Escape: Close menu

Filtering:
- Results auto-filter as you type after `/`
- Searches by title, description, and search terms

### Formatting Toolbar

Located above editor content:

**Text Formatting**
- Bold (Ctrl+B)
- Italic (Ctrl+I)
- Strikethrough
- Inline Code

**Block Types**
- Paragraph
- Heading 1
- Heading 2
- Heading 3

**Lists**
- Bullet List
- Ordered List

**Special**
- Quote
- Code Block
- Divider

Visual feedback: Selected/active formatting shows blue background

### Auto-Save

**Local Storage**
- Saves every 2 seconds to localStorage
- Stored as JSON: `{ content: HTML, updatedAt: timestamp }`
- Key: `youlearn_stage2_notes`
- Persists across page reloads

**Server Persistence**
- Manual "Save to Server" button click
- Requires authentication
- Saves to MongoDB with userId
- Updates `updatedAt` timestamp
- Shows success/error feedback

### UI/UX Features

**Header**
- Title: "Notes"
- Last saved timestamp (updates after server save)
- Status indicator (green checkmark or error)
- Export button (download as text file)
- Save to Server button

**Editor**
- Rich formatting with Tiptap
- Placeholder text
- Auto-expanding for content
- Visual formatting indicators in toolbar

**Footer**
- Character count
- Auto-save indicator
- Instruction: "Press '/' for slash commands"

## Usage

### For Users

1. **Navigate to Notes**
   - Click "Notes" tab in chat layout

2. **Create Content**
   - Type directly or press `/` for commands
   - Use toolbar buttons for formatting

3. **Use Slash Commands**
   - Press `/` to open menu
   - Type to filter (e.g., `/head` for headings)
   - Select with arrow keys or click

4. **Format Text**
   - Select text with mouse
   - Click toolbar buttons or use keyboard shortcuts
   - Active formatting shows in blue

5. **Save**
   - Auto-saves locally every 2 seconds
   - Click "Save to Server" for persistent storage (requires login)
   - See timestamp after successful save

6. **Export**
   - Click "Export" button
   - Downloads as `notes_[timestamp].txt`

### For Developers

**Integration Pattern** (matches flashcards/quizzes):

1. Component receives `onDataSaved` callback
2. Component manages local state (`content`)
3. Auto-save to localStorage
4. Manual save triggers API POST with HTML content
5. After server save, calls `onDataSaved()` to refresh
6. Error handling with user feedback

**API Usage**

Save notes:
```javascript
const response = await fetch('/api/secondStage/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: htmlString }),
});
const data = await response.json();
```

Load notes:
```javascript
const response = await fetch('/api/secondStage/notes');
const data = await response.json();
// data.content is HTML
```

**Customization**

Add new slash commands in `SECONDARY_TiptapEditor.jsx`:

```javascript
const SLASH_COMMANDS = [
  {
    title: 'Custom Block',
    description: 'Custom description',
    searchTerms: ['custom', 'block'],
    icon: CustomIcon,
    command: ({ editor }) => {
      editor.chain().focus().toggleCustom().run();
    },
  },
  // ... more commands
];
```

**Styling**

Classes use Tailwind CSS (matches project theme):
- Editor background: `bg-white`
- Toolbar background: `bg-gray-50`
- Borders: `border-gray-200`
- Active states: `bg-blue-100 text-blue-600`
- Text: `text-gray-900`

## State Flow

```
User Input
    ↓
Tiptap Editor
    ↓
onChange callback → setContent(html)
    ↓
Auto-save timer (2s)
    ↓
localStorage update
    ↓
Manual: Save to Server button
    ↓
POST /api/secondStage/notes
    ↓
MongoDB upsert
    ↓
Update lastSaved + status
    ↓
Trigger onDataSaved() callback
```

## Dependencies

Already installed in package.json:
- `@tiptap/react` - React integration
- `@tiptap/starter-kit` - Core extensions
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-character-count` - Character count
- `lucide-react` - Icons for toolbar and menu

## Testing Checklist

- [ ] Editor loads and shows placeholder
- [ ] Typing works and content updates
- [ ] Toolbar buttons format text correctly
- [ ] Slash command menu opens with `/`
- [ ] Slash menu filters by search term
- [ ] Arrow keys navigate menu
- [ ] Enter selects menu item
- [ ] Escape closes menu
- [ ] Auto-save works (check localStorage)
- [ ] Export downloads text file
- [ ] Save to Server works (requires auth)
- [ ] Notes persist after page reload
- [ ] Formatting preserved after save
- [ ] Error handling on API failure
- [ ] Anonymous users can edit but can't save
- [ ] Character count displays correctly

## Known Limitations

- Slash menu appears at cursor position (uses absolute positioning)
- No collaborative editing (single user per notes document)
- No version history/undo server-side (browser undo/redo only)
- No rich media (images, videos, embeds) - can be added via Tiptap extensions
- No search/replace functionality

## Future Enhancements

- Add more extensions: image uploads, links, mentions
- Implement note categories/tags
- Add markdown import/export
- Note-taking templates
- Collaboration features
- Version history
- Full-text search
- Dark mode support
- Mobile optimizations

## Migration from Old Notes

If migrating from plain text:
1. Old content stored as plain strings
2. New content stored as HTML
3. Existing plain text loads correctly (renders as `<p>text</p>`)
4. When edited and re-saved, becomes rich HTML

## File Structure

```
src/
├── components/
│   ├── SECONDARY_NotesPanel.jsx       # Container component
│   └── SECONDARY_TiptapEditor.jsx     # Rich editor with slash commands
└── app/
    └── api/secondStage/
        └── notes/route.js            # API endpoint
```

## Environment Setup

1. Tiptap is already installed
2. MongoDB URI: `SECONDARY_MONGODB_URI` env var
3. Authentication: Ensure `getUserIfAuthenticated()` works
4. No additional setup required

## Troubleshooting

**Editor not showing**
- Check console for errors
- Verify `SECONDARY_TiptapEditor` import
- Ensure Tiptap extensions load

**Slash menu not appearing**
- Type `/` to trigger
- Check console for React errors
- Verify `SLASH_COMMANDS` array is populated

**Save fails**
- Check authentication status (anonymous users blocked)
- Verify MongoDB URI is set
- Check browser console network tab

**Content doesn't persist**
- Check if localStorage is enabled
- Verify MongoDB connection
- Check browser storage quota

**Slow typing**
- Autosave timeout (2s) shouldn't affect typing
- Check for browser extensions interfering
- Verify no heavy components re-rendering

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all env vars are set
3. Check database connection
4. Review API logs
5. Test with simple content first
