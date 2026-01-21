// FILE: src/components/rag/README.md
// DESCRIPTION: Documentation for RAG UI components
// PURPOSE: Explains how to integrate and use RAG UI in the chat interface

# RAG UI Components - Integration Guide

## Overview

RAG UI components provide optional slash commands and context preview features for the chat interface. These components are **completely optional** and do not affect the application when not used.

## Components

### 1. `RagSlashMenu.jsx`
**Purpose:** Displays menu when user types `/` in the chat input

**Props:**
- `isOpen` (boolean): Whether menu is visible
- `selectedIndex` (number): Currently highlighted menu item
- `onSelect` (function): Called when user selects a command
- `onClose` (function): Called when menu should close

**Usage Example:**
```jsx
import RagSlashMenu from '@/components/rag/RagSlashMenu';

export default function ChatInput() {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleInputChange = (text) => {
    setShowSlashMenu(text.startsWith('/'));
  };

  const handleSelectCommand = (command) => {
    // Send message with RAG metadata
    // command.source indicates which sources to search
  };

  return (
    <div>
      <RagSlashMenu
        isOpen={showSlashMenu}
        selectedIndex={selectedIndex}
        onSelect={handleSelectCommand}
        onClose={() => setShowSlashMenu(false)}
      />
      <input
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Type / for context options..."
      />
    </div>
  );
}
```

### 2. `RagSourceSelector.jsx`
**Purpose:** Compact dropdown for selecting which sources to include

**Props:**
- `selectedSources` (string[]): Currently selected source types
- `onSourcesChange` (function): Called when selection changes

**Usage Example:**
```jsx
import RagSourceSelector from '@/components/rag/RagSourceSelector';

export default function ChatInterface() {
  const [ragSources, setRagSources] = useState([]);

  const handleSendMessage = async () => {
    const response = await fetch('/api/secondStage/chat', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        prompt: message,
        rag: ragSources.length > 0 ? { sources: ragSources } : null,
      }),
    });
  };

  return (
    <>
      <RagSourceSelector
        selectedSources={ragSources}
        onSourcesChange={setRagSources}
      />
      <button onClick={handleSendMessage}>Send</button>
    </>
  );
}
```

### 3. `RagContextPreview.jsx`
**Purpose:** Displays what RAG retrieved before the LLM processes it

**Props:**
- `results` (array): Retrieved documents from RAG
- `isLoading` (boolean): Show loading state
- `onDismiss` (function): Called when user closes preview

**Usage Example:**
```jsx
import RagContextPreview from '@/components/rag/RagContextPreview';

export default function ChatInterface() {
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);

  const handleSendWithRAG = async () => {
    setRagLoading(true);
    const response = await fetch('/api/secondStage/chat', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        prompt: message,
        rag: { sources: selectedSources },
      }),
    });
    const data = await response.json();
    setRagResults(data.rag?.results || []);
    setRagLoading(false);
  };

  return (
    <>
      <RagContextPreview
        results={ragResults}
        isLoading={ragLoading}
        onDismiss={() => setRagResults([])}
      />
    </>
  );
}
```

## Constants: `rag.constants.js`

**RAG_SOURCES:** Maps source types to display info
```javascript
RAG_SOURCES.flashcard => {
  label: 'Flashcards',
  description: 'Search your flashcard decks',
  icon: '🎴',
  color: '#4f46e5'
}
```

**RAG_SLASH_COMMANDS:** Available slash commands
```javascript
[
  { command: '/context-flashcard', label: 'Flashcards', source: 'flashcard' },
  { command: '/context-quiz', label: 'Quizzes', source: 'quiz' },
  { command: '/context-note', label: 'Notes', source: 'note' },
  { command: '/context-all', label: 'All Sources', source: null },
]
```

**getSimilarityLevel(similarity):** Get color and label for similarity score
```javascript
getSimilarityLevel(0.85) // => { min: 0.8, label: 'Very Relevant', color: '#16a34a' }
```

**detectSlashCommand(text):** Check if text starts with slash command
```javascript
detectSlashCommand('/context-f') // => '/context-f'
detectSlashCommand('hello') // => null
```

## Integration with Chat Component

### Step 1: Import Components
```javascript
import RagSlashMenu from '@/components/rag/RagSlashMenu';
import RagSourceSelector from '@/components/rag/RagSourceSelector';
import RagContextPreview from '@/components/rag/RagContextPreview';
import { detectSlashCommand, RAG_SLASH_COMMANDS } from '@/components/rag/rag.constants';
```

### Step 2: Manage RAG State
```javascript
const [ragSources, setRagSources] = useState([]);
const [showSlashMenu, setShowSlashMenu] = useState(false);
const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
const [ragResults, setRagResults] = useState([]);
const [ragLoading, setRagLoading] = useState(false);
```

### Step 3: Handle Input Changes
```javascript
const handleComposerTextChange = (text) => {
  setComposerText(text);
  
  // Show slash menu if text starts with /
  const hasSlashCommand = detectSlashCommand(text);
  setShowSlashMenu(hasSlashCommand !== null);
  setSelectedMenuIndex(0); // Reset selection
};
```

### Step 4: Handle Slash Menu Selection
```javascript
const handleSelectSlashCommand = (command) => {
  if (command.source === null) {
    // '/context-all' - use all sources
    // import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
    setRagSources(RAG_CONTENT_TYPES);
  } else {
    // Single source
    setRagSources([command.source]);
  }
  
  // Clear slash menu
  setShowSlashMenu(false);
  
  // Keep the message text but remove the slash command
  const messageWithoutSlash = composerText
    .replace(/^\/[a-z\-]+\s*/, '')
    .trim();
  setComposerText(messageWithoutSlash);
};
```

### Step 5: Send Message with RAG
```javascript
const handleSendMessage = async () => {
  if (!composerText.trim() || !chatId) return;

  const userMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: composerText,
  };

  setMessages((prev) => [...prev, userMessage]);
  setComposerText('');
  setRagSources([]); // Clear RAG selection
  setIsLoading(true);

  try {
    // Build request payload
    const payload = {
      chatId,
      prompt: composerText,
      stream: false,
    };

    // Add RAG config if sources selected
    if (ragSources.length > 0) {
      payload.rag = { sources: ragSources };
    }

    const response = await fetch('/api/secondStage/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // Extract RAG results if available
    if (data.rag && data.rag.results) {
      setRagResults(data.rag.results);
    }

    const assistantMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: data.content,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Step 6: Render Components in Chat
```jsx
<div className="chat-input-container">
  {/* RAG Context Preview */}
  <RagContextPreview
    results={ragResults}
    isLoading={ragLoading}
    onDismiss={() => setRagResults([])}
  />

  {/* Message Composer */}
  <div className="relative">
    {/* RAG Slash Menu */}
    <RagSlashMenu
      isOpen={showSlashMenu}
      selectedIndex={selectedMenuIndex}
      onSelect={handleSelectSlashCommand}
      onClose={() => setShowSlashMenu(false)}
    />

    {/* Source Selector */}
    {ragSources.length > 0 && (
      <div className="mb-2">
        <RagSourceSelector
          selectedSources={ragSources}
          onSourcesChange={setRagSources}
        />
      </div>
    )}

    {/* Text Input */}
    <textarea
      value={composerText}
      onChange={(e) => handleComposerTextChange(e.target.value)}
      onKeyDown={handleKeyboardShortcuts}
      placeholder="Type / for context options..."
    />

    {/* Send Button */}
    <button onClick={handleSendMessage} disabled={isLoading || !composerText.trim()}>
      {isLoading ? 'Loading...' : 'Send'}
    </button>
  </div>
</div>
```

## Keyboard Navigation

The slash menu supports keyboard navigation:
- **Arrow Down/Up:** Navigate menu items
- **Enter:** Select highlighted item
- **Escape:** Close menu

Example handler:
```javascript
const handleComposerKeyDown = (e) => {
  if (showSlashMenu) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMenuIndex((prev) => 
        Math.min(prev + 1, RAG_SLASH_COMMANDS.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMenuIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectSlashCommand(RAG_SLASH_COMMANDS[selectedMenuIndex]);
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
  }
};
```

## Non-Breaking Design

These components are designed to be **completely optional**:

1. **If components are not used:** App works exactly as before
2. **If components are used but RAG not selected:** Message sent without RAG metadata
3. **If components fail:** Graceful fallback to non-RAG chat

## Styling

Components use Tailwind CSS classes. If your project uses a different CSS framework:
- Replace `bg-blue-50` style classes with your framework equivalents
- Or import components and override with custom CSS
- All components accept `className` props for customization

## Accessibility

Components include:
- `role="menu"` and `role="menuitem"` for semantic HTML
- `aria-selected` for menu state
- `aria-label` for icon buttons
- Keyboard navigation support

## Future Enhancements

TODO: Add these features in future iterations:
- [ ] Debounced slash menu (hide after 2s of inactivity)
- [ ] Search within slash menu results
- [ ] Custom RAG source names (user-created collections)
- [ ] RAG history (what was retrieved last time)
- [ ] Toggle between "cite sources" and "don't cite" modes
- [ ] Drag-and-drop to reorder retrieved results
