# RAG Integration Guide for SECONDARY_ChatWindow.jsx

## Overview

This guide explains how to integrate RAG UI components into your existing chat interface without breaking any current functionality.

## Current Flow (Unchanged)

```
User types message
    ↓
Hits Enter
    ↓
Message sent to /api/secondStage/chat
    ↓
LLM response received
    ↓
Message displayed
```

## New Flow (With RAG - Optional)

```
User types message
    ↓
(Optional) User types "/" to see context options
    ↓
(Optional) User selects "/context-flashcard" or similar
    ↓
Message sent WITH rag metadata
    ↓
Backend retrieves context (new RAG step)
    ↓
LLM sees augmented prompt with context
    ↓
Response received and displayed
```

## Step-by-Step Integration

### Step 1: Add Imports

At the top of `SECONDARY_ChatWindow.jsx`:

```javascript
'use client';

import { useState, useRef, useEffect } from 'react';
// ... existing imports ...

// NEW RAG IMPORTS
import RagSlashMenu from '../rag/RagSlashMenu';
import RagSourceSelector from '../rag/RagSourceSelector';
import RagContextPreview from '../rag/RagContextPreview';
import { 
  detectSlashCommand, 
  RAG_SLASH_COMMANDS 
} from '../rag/rag.constants';
```

### Step 2: Add State Variables

In your `SECONDARY_ChatWindow` component, add these states:

```javascript
export default function SECONDARY_ChatWindow({
  chatId = null,
  onDataSaved = () => {},
  onTabChange = () => {},
  refreshTrigger = 0,
}) {
  // ... existing states ...
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // NEW RAG STATES
  const [ragSources, setRagSources] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
```

### Step 3: Update Input Handler

Replace or update the existing text input handler:

```javascript
// EXISTING HANDLER - Update it like this
const handleComposerChange = (e) => {
  const text = e.target.value;
  setComposerText(text);

  // NEW: Detect slash commands
  const hasSlashCommand = detectSlashCommand(text);
  setShowSlashMenu(hasSlashCommand !== null);
  setSelectedMenuIndex(0);
};
```

### Step 4: Add Keyboard Navigation for Slash Menu

Add this handler for keyboard navigation:

```javascript
// NEW: Keyboard handler for slash menu
const handleComposerKeyDown = (e) => {
  if (showSlashMenu) {
    // Navigation within slash menu
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMenuIndex((prev) =>
        Math.min(prev + 1, RAG_SLASH_COMMANDS.length - 1)
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMenuIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const command = RAG_SLASH_COMMANDS[selectedMenuIndex];
      handleSelectSlashCommand(command);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSlashMenu(false);
      return;
    }
  }

  // EXISTING: Handle other keyboard shortcuts
  // (Keep your existing Enter handler, etc.)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};
```

### Step 5: Add Slash Command Handler

```javascript
// NEW: Handle slash command selection
const handleSelectSlashCommand = (command) => {
  if (command.source === null) {
    // "/context-all" - use all sources
    // import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
    setRagSources(RAG_CONTENT_TYPES);
  } else {
    // Single source selected
    setRagSources([command.source]);
  }

  // Close slash menu
  setShowSlashMenu(false);

  // Remove the slash command from the message text
  const messageWithoutSlash = composerText
    .replace(/^\/[\w\-]+\s*/, '')
    .trim();
  setComposerText(messageWithoutSlash);

  // Optional: Auto-focus back to input
  // inputRef.current?.focus();
};
```

### Step 6: Update Send Message Handler

Update your existing `handleSendMessage`:

```javascript
// EXISTING - Update it to include RAG
const handleSendMessage = async () => {
  if (!composerText.trim() || !chatId) {
    if (!chatId) {
      alert('No chat selected. Please create or select a chat first.');
    }
    return;
  }

  const userMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: composerText,
    selected: false,
  };

  setMessages((prev) => [...prev, userMessage]);
  setComposerText('');
  setRagSources([]); // Clear RAG selection after sending
  setIsLoading(true);
  setRagLoading(false);

  try {
    // NEW: Build request with optional RAG
    const requestBody = {
      chatId,
      prompt: composerText,
      stream: false,
    };

    // Only add RAG if sources selected
    if (ragSources.length > 0) {
      requestBody.rag = {
        sources: ragSources,
        topK: 5,
        threshold: 0.3,
      };
      setRagLoading(true);
    }

    const response = await fetch('/api/secondStage/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    // NEW: Extract RAG results if available
    if (data.rag?.results) {
      setRagResults(data.rag.results);
    }

    const assistantMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: data.content,
      selected: false,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    onDataSaved(); // Trigger refresh if needed
  } catch (error) {
    console.error('Error sending message:', error);
    // Show error message to user
    const errorMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'system',
      content: `Error: ${error.message}`,
      selected: false,
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    setRagLoading(false);
  }
};
```

### Step 7: Update JSX Render

In your render section, add RAG components:

```jsx
return (
  <div className="chat-container">
    {/* Existing messages container */}
    <div className="messages-container">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${msg.role}`}
          onClick={() => handleMessageSelect(msg.id)}
        >
          {/* Existing message rendering */}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>

    {/* NEW: RAG Context Preview - show what was retrieved */}
    {ragResults.length > 0 && (
      <RagContextPreview
        results={ragResults}
        isLoading={ragLoading}
        onDismiss={() => setRagResults([])}
      />
    )}

    {/* Composer section */}
    <div className="composer-container">
      {/* NEW: Show selected RAG sources */}
      {ragSources.length > 0 && (
        <div className="mb-3">
          <RagSourceSelector
            selectedSources={ragSources}
            onSourcesChange={setRagSources}
          />
        </div>
      )}

      {/* Existing composer textarea */}
      <div className="relative">
        {/* NEW: Slash menu appears here */}
        <RagSlashMenu
          isOpen={showSlashMenu}
          selectedIndex={selectedMenuIndex}
          onSelect={handleSelectSlashCommand}
          onClose={() => setShowSlashMenu(false)}
        />

        <textarea
          ref={composerInputRef}
          value={composerText}
          onChange={handleComposerChange}
          onKeyDown={handleComposerKeyDown}
          placeholder="Type / for context options... or just start typing"
          className="composer-input"
          rows={4}
        />

        {/* Existing send button */}
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !composerText.trim()}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  </div>
);
```

## Complete Code Example

Here's a simplified version of the key parts:

```jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import theme from '../design/theme.config';
import RagSlashMenu from '../rag/RagSlashMenu';
import RagSourceSelector from '../rag/RagSourceSelector';
import RagContextPreview from '../rag/RagContextPreview';
import { detectSlashCommand, RAG_SLASH_COMMANDS } from '../rag/rag.constants';

export default function SECONDARY_ChatWindow({
  chatId = null,
  onDataSaved = () => {},
  onTabChange = () => {},
  refreshTrigger = 0,
}) {
  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);

  // Existing states
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // NEW: RAG states
  const [ragSources, setRagSources] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [ragResults, setRagResults] = useState([]);

  // Load chat history
  useEffect(() => {
    if (chatId) {
      const loadMessages = async () => {
        try {
          const response = await fetch(
            `/api/secondStage/chat-history?chatId=${chatId}`
          );
          if (!response.ok) return;
          const data = await response.json();
          const conversationMessages = (data.messages || [])
            .filter((msg) => msg.role !== 'system')
            .map((msg) => ({
              id: msg._id || `msg_${msg.sequenceNumber}`,
              role: msg.role,
              content: msg.content,
              selected: false,
            }));
          setMessages(conversationMessages);
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      };
      loadMessages();
    }
  }, [chatId, refreshTrigger]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle composer text change
  const handleComposerChange = (e) => {
    const text = e.target.value;
    setComposerText(text);

    // Detect slash commands
    const hasSlashCommand = detectSlashCommand(text);
    setShowSlashMenu(hasSlashCommand !== null);
    setSelectedMenuIndex(0);
  };

  // Handle keyboard input
  const handleComposerKeyDown = (e) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMenuIndex((prev) =>
          Math.min(prev + 1, RAG_SLASH_COMMANDS.length - 1)
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMenuIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectSlashCommand(RAG_SLASH_COMMANDS[selectedMenuIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle slash command selection
  const handleSelectSlashCommand = (command) => {
    if (command.source === null) {
      // import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js'
      setRagSources(RAG_CONTENT_TYPES);
    } else {
      setRagSources([command.source]);
    }
    setShowSlashMenu(false);
    const cleanText = composerText.replace(/^\/[\w\-]+\s*/, '').trim();
    setComposerText(cleanText);
  };

  // Send message with optional RAG
  const handleSendMessage = async () => {
    if (!composerText.trim() || !chatId) return;

    const originalPrompt = composerText;
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: originalPrompt,
      selected: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setComposerText('');
    setRagSources([]);
    setIsLoading(true);

    try {
      const requestBody = {
        chatId,
        prompt: originalPrompt,
        stream: false,
      };

      if (ragSources.length > 0) {
        requestBody.rag = { sources: ragSources };
      }

      const response = await fetch('/api/secondStage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.rag?.results) {
        setRagResults(data.rag.results);
      }

      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.content,
        selected: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onDataSaved();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'system',
        content: `Error: ${error.message}`,
        selected: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      {/* Messages */}
      <div className="messages-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* RAG Preview */}
      <RagContextPreview
        results={ragResults}
        onDismiss={() => setRagResults([])}
      />

      {/* Composer */}
      <div className="composer">
        {ragSources.length > 0 && (
          <RagSourceSelector
            selectedSources={ragSources}
            onSourcesChange={setRagSources}
          />
        )}

        <div className="composer-input-container relative">
          <RagSlashMenu
            isOpen={showSlashMenu}
            selectedIndex={selectedMenuIndex}
            onSelect={handleSelectSlashCommand}
            onClose={() => setShowSlashMenu(false)}
          />

          <textarea
            ref={composerInputRef}
            value={composerText}
            onChange={handleComposerChange}
            onKeyDown={handleComposerKeyDown}
            placeholder="Type / for context... (shift+enter for new line)"
            disabled={isLoading}
          />

          <button
            onClick={handleSendMessage}
            disabled={isLoading || !composerText.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Important Notes

1. **Backward Compatible**: If you don't add RAG components, the chat works exactly as before
2. **Optional RAG**: Users see RAG features only if they type "/"
3. **No Breaking Changes**: All existing functionality unchanged
4. **Graceful Fallback**: If RAG fails, chat still works with original prompt
5. **Clean UI**: RAG UI only appears when relevant

## Testing

Test different scenarios:

1. **Normal chat (no RAG):**
   - Type message and send
   - Should work exactly as before

2. **With RAG:**
   - Type "/"
   - See slash menu
   - Select source
   - Send message
   - Should see context preview and get RAG-enhanced response

3. **RAG errors (graceful):**
   - Disable API key or DB
   - Try RAG
   - Chat should still work with original prompt

---

For more details, see:
- [RAG Backend README](src/lib/rag/README.md)
- [RAG UI README](src/components/rag/README.md)
- [Main Implementation Guide](RAG_IMPLEMENTATION.md)
