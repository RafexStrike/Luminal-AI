# RAG Context Sidebar Documentation

## Overview

The RAG Context Sidebar is a right-aligned, resizable panel in the ChatWindow that displays:
- **Selected RAG sources** (flashcard, quiz, note, etc.)
- **Retrieved context** with similarity scores
- **Document metadata** (tags, difficulty, etc.)

The sidebar is **conditionally rendered** only when RAG sources are selected or results are available.

---

## Architecture & Components

### Component Tree

```
ChatWindow
├── Main Content Area (flex-1)
│   ├── Messages Scrollable Area
│   └── Composer Area (input + RAG controls)
├── Resize Handle (divider)
└── RagContextSidebar (conditional)
    ├── Header (title + collapse button)
    ├── RagSourceBadges (source icons)
    └── RagResultCard[] (retrieved items)
```

### Key Components

#### 1. **RagContextSidebar** (`src/components/rag/RagContextSidebar.jsx`)
Main sidebar wrapper. Handles:
- Conditional rendering (hides if no sources or results)
- Collapse/expand toggle
- Resize handle management
- Content sections layout

**Props:**
```javascript
{
  ragSources: string[],        // ['flashcard', 'quiz', 'note', ...]
  ragResults: object[],        // Retrieved documents with similarity scores
  isCollapsed: boolean,        // Sidebar collapsed state
  onToggleCollapse: fn,        // Toggle collapse callback
  sidebarWidth: number,        // Width in pixels (320-600)
  onResizeStart: fn,           // Mouse down on resize handle
  isResizing: boolean,         // Is resize in progress
  onMouseMove: fn,             // Mouse move callback (for resize)
}
```

#### 2. **RagSourceBadges** (`src/components/rag/RagSourceBadges.jsx`)
Displays selected source types as colored badges with icons.

**Supported sources:**
```javascript
{
  flashcard: { icon: '🎴', label: 'Flashcards', color: 'bg-blue-500/20 ...' },
  quiz:      { icon: '❓', label: 'Quizzes',   color: 'bg-purple-500/20 ...' },
  note:      { icon: '📝', label: 'Notes',    color: 'bg-green-500/20 ...' },
  // Add new types here for future content types
}
```

#### 3. **RagResultCard** (`src/components/rag/RagResultCard.jsx`)
Individual result item with:
- Source type icon and name
- Similarity score (0-100%)
- Text preview (3 lines max)
- Metadata tags (difficulty, custom tags)

---

## Hook: useRagSidebarState

Located in `src/hooks/useRagSidebarState.js`

Manages all sidebar state:
```javascript
const {
  isCollapsed,      // Current collapse state
  toggleCollapse,   // fn: toggle collapse
  sidebarWidth,     // Current width (px)
  setSidebarWidth,  // fn: set width
  isResizing,       // Is resize active
  startResize,      // fn: begin resize (onMouseDown)
  handleMouseMove,  // fn: resize handler
  stopResize,       // fn: end resize
} = useRagSidebarState(defaultWidth = 320);
```

**Constraints:**
- Min width: 200px
- Max width: 600px

---

## Integration in ChatWindow

### 1. Import Components
```javascript
import { RagContextSidebar } from './rag/RagContextSidebar';
import { useRagSidebarState } from '@/hooks/useRagSidebarState';
```

### 2. Initialize Hook
```javascript
const ragSidebarState = useRagSidebarState();
```

### 3. Update Layout Structure
The ChatWindow now uses a **three-column flex layout**:
```jsx
<div className="flex flex-1 overflow-hidden">
  {/* Left: Messages + Composer (flex-1) */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* Messages */}
    {/* Composer */}
  </div>

  {/* Right: RAG Sidebar (conditional, resizable) */}
  <RagContextSidebar
    ragSources={ragSources}
    ragResults={ragResults}
    isCollapsed={ragSidebarState.isCollapsed}
    onToggleCollapse={ragSidebarState.toggleCollapse}
    sidebarWidth={ragSidebarState.sidebarWidth}
    onResizeStart={ragSidebarState.startResize}
    isResizing={ragSidebarState.isResizing}
    onMouseMove={ragSidebarState.handleMouseMove}
  />
</div>
```

---

## UI/UX Features

### Collapse Toggle
- Click the `›` / `‹` button in the header
- Collapsed state shows badge with result count
- Full state shows all content

### Resizable Width
- Hover over the left border (divider) to see resize cursor
- Drag to adjust width (200-600px)
- Real-time update during resize

### Source Badges
- Color-coded by type (blue=flashcard, purple=quiz, green=note)
- Icon + label for clarity
- Extensible for new types

### Result Cards
- Sorted by similarity (highest first)
- Hover effect for interactivity
- Text preview with line clamping
- Metadata display (tags, difficulty)

---

## Styling & Theme

All components follow the project's existing Tailwind theme:
- Dark mode: `bg-gray-900`, `bg-gray-950`
- Accent: `purple-500`, `purple-600`
- Borders: `border-gray-800/50`, `border-gray-700/30`
- Text: `text-gray-300`, `text-gray-400`

### Customization Points
1. **Source badge colors** → Edit `sourceColors` in `RagSourceBadges.jsx`
2. **Result card styling** → Edit classes in `RagResultCard.jsx`
3. **Sidebar header** → Edit `RagContextSidebar.jsx` header section
4. **Default width** → Pass to `useRagSidebarState(customWidth)`

---

## Extensibility for Future Content Types

### Adding a New Source Type (e.g., Video)

**Step 1:** Update content types
```javascript
// src/lib/rag/content-types.js
export const RAG_CONTENT_TYPES = ['flashcard', 'quiz', 'note', 'video'];

export const RAG_SOURCE_META = {
  // ... existing ...
  video: {
    command: '/context-video',
    label: 'Videos',
    icon: '🎥',
  },
};
```

**Step 2:** Add icon mapping
```javascript
// src/components/rag/RagSourceBadges.jsx
const sourceIcons = {
  // ... existing ...
  video: { icon: '🎥', label: 'Videos', color: 'bg-red-500/20 border-red-500/40 text-red-300' },
};

// src/components/rag/RagResultCard.jsx
const sourceIcons = {
  // ... existing ...
  video: '🎥',
};
```

**Step 3:** Update RAG slash commands (if needed)
```javascript
// src/components/rag/rag.constants.js - will auto-generate from content-types
```

**Step 4:** No changes needed to sidebar - it automatically renders new types!

---

## Performance Considerations

1. **Conditional Rendering**: Sidebar unmounts completely when not in use
2. **Resize Optimization**: Event listeners only active during resize
3. **Memoization**: Components memoized to prevent unnecessary re-renders
4. **Smooth Scrolling**: Sidebar content independently scrollable

---

## Accessibility

- **Keyboard Navigation**: Tab through sidebar buttons
- **Aria Labels**: Collapse button labeled for screen readers
- **Focus Management**: Focus visible on all interactive elements
- **Color Contrast**: Meets WCAG AA standards

---

## Testing

### Manual Testing Checklist
- [ ] Sidebar appears only when `ragSources.length > 0` or `ragResults.length > 0`
- [ ] Collapse toggle works smoothly
- [ ] Resize handle draggable (200px min, 600px max)
- [ ] Result cards display similarity scores
- [ ] Source badges show correct icons/colors
- [ ] Sidebar doesn't shrink chat window
- [ ] Right-side alignment correct
- [ ] Responsive on mobile (should hide or float)

### Integration Test
```javascript
// In ChatWindow test
const { ragSources, setRagSources } = useState([]);
const { ragResults, setRagResults } = useState([]);

// Set some results
setRagSources(['flashcard']);
setRagResults([
  {
    sourceType: 'flashcard',
    text: 'Sample flashcard content...',
    similarity: 0.85,
    metadata: { tags: ['biology'], difficulty: 'medium' }
  }
]);

// Verify sidebar renders
expect(screen.getByText('RAG Context')).toBeInTheDocument();
expect(screen.getByText('Retrieved Context (1)')).toBeInTheDocument();
```

---

## Known Limitations & Future Improvements

1. **Mobile Layout**: Sidebar currently always visible on desktop; could be bottom drawer on mobile
2. **Result Interactions**: Could add click-to-expand, copy-to-clipboard actions
3. **Sorting**: Currently sorted by similarity; could add filter/sort controls
4. **Persistence**: Sidebar width/collapsed state not persisted to localStorage
5. **Scroll Sync**: Sidebar scroll independent from messages; could sync for UX

---

## File Structure

```
src/
├── components/
│   └── rag/
│       ├── RagContextSidebar.jsx       (main component)
│       ├── RagSourceBadges.jsx         (badges display)
│       ├── RagResultCard.jsx           (result cards)
│       └── rag.constants.js            (slash commands, etc.)
├── hooks/
│   └── useRagSidebarState.js           (sidebar state hook)
└── SECONDARY_ChatWindow.jsx            (integration point)
```

---

## API Reference

### RagContextSidebar Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `ragSources` | `string[]` | No | `[]` | Selected source types |
| `ragResults` | `object[]` | No | `[]` | Retrieved documents |
| `isCollapsed` | `boolean` | No | `false` | Sidebar collapsed state |
| `onToggleCollapse` | `function` | No | `() => {}` | Collapse toggle handler |
| `sidebarWidth` | `number` | No | `320` | Sidebar width in pixels |
| `onResizeStart` | `function` | No | `() => {}` | Resize start handler |
| `isResizing` | `boolean` | No | `false` | Resize in progress flag |
| `onMouseMove` | `function` | No | `() => {}` | Mouse move handler |

### useRagSidebarState Options
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultWidth` | `number` | `320` | Initial sidebar width |

---

## Troubleshooting

### Sidebar not appearing
- Check `ragSources.length > 0` or `ragResults.length > 0`
- Verify components are imported
- Check browser console for errors

### Resize not working
- Ensure `onMouseMove` handler is properly attached to document
- Verify `isResizing` state is toggling
- Check CSS cursor styles

### Styling looks wrong
- Verify Tailwind CSS is properly configured
- Check for CSS conflicts in global styles
- Ensure dark mode class is applied to root element

---

## Summary

The RAG Context Sidebar provides a clean, extensible right-side panel for displaying retrieved context during RAG-enhanced chat. It's fully separated from ChatWindow logic, resizable, collapsible, and ready for future content types without modification.
