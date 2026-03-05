// FILE: src/components/SECONDARY_ChatWindow.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import theme from '../design/theme.config';
import chat from '../design/chat.config';

// --- IMPORTS for styling up the LLM response START ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// --- NEW IMPORTS for styling up the LLM response END ---

// --- RAG IMPORTS START ---
import RagSlashMenu from './rag/RagSlashMenu';
import { RagContextSidebar } from './rag/RagContextSidebar';
import { detectSlashCommand, RAG_SLASH_COMMANDS } from './rag/rag.constants';
import { RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js';
import ChatComposer from './SECONDARY_ChatComposer';
// --- RAG IMPORTS END ---

// --- HOOKS IMPORTS START ---
import { useRagSidebarState } from '@/hooks/useRagSidebarState';
// --- HOOKS IMPORTS END ---

// --- INTERACTIVE IMPORTS START ---
import { INTERACTIVE_useInteractiveMode } from '@/hooks/INTERACTIVE_useInteractiveMode';
import { INTERACTIVE_ChatResultCard } from '@/components/interactive/INTERACTIVE_ChatResultCard';
import { INTERACTIVE_InteractiveExplainer } from '@/components/interactive/INTERACTIVE_InteractiveExplainer';
// --- INTERACTIVE IMPORTS END ---

import { useRouter } from 'next/navigation';

export default function SECONDARY_ChatWindow({
  chatId = null,
  onDataSaved = () => { },
  onTabChange = () => { },
  refreshTrigger = 0,
}) {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showStreamingPlaceholder, setShowStreamingPlaceholder] = useState(false);

  // --- RAG STATE START ---
  const [ragSources, setRagSources] = useState([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [ragResults, setRagResults] = useState([]);
  const ragSidebarState = useRagSidebarState();
  // --- RAG STATE END ---

  // --- INTERACTIVE STATE START ---
  const { isInteractiveQuery, status: interactiveStatus, result: interactiveResult, generate: generateInteractive, reset: resetInteractive } = INTERACTIVE_useInteractiveMode(composerText);
  // openSpec holds the spec payload currently shown in the full-screen modal
  const [openSpec, setOpenSpec] = useState(null);
  // Ref to track the message ID of the most recently inserted interactive card
  const activeInteractiveCardIdRef = useRef(null);
  // --- INTERACTIVE STATE END ---

  // Reactively patch the most recent interactive card when hook state changes
  useEffect(() => {
    const cardId = activeInteractiveCardIdRef.current;
    if (!cardId) return;
    if (interactiveStatus === 'idle') return; // nothing to patch yet

    console.log('INTERACTIVE: patching card', { cardId, interactiveStatus });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === cardId
          ? {
            ...m,
            interactiveStatus,
            interactiveSpec: interactiveResult?.payload ?? m.interactiveSpec,
          }
          : m
      )
    );

    // Sync to DB when terminal state is reached
    if (interactiveStatus === 'success' || interactiveStatus === 'error') {
      const updates = {
        interactiveStatus,
        interactiveSpec: interactiveResult?.payload || null
      };

      fetch('/api/secondStage/message/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: cardId, updates }),
      }).catch(err => console.error('INTERACTIVE: Failed to sync terminal state to DB', err));

      activeInteractiveCardIdRef.current = null;
    }
  }, [interactiveStatus, interactiveResult]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      const loadMessages = async () => {
        try {
          const response = await fetch(
            `/api/secondStage/chat-history?chatId=${chatId}`
          );

          if (!response.ok) {
            console.error('Failed to load chat history');
            return;
          }

          const data = await response.json();
          const conversationMessages = (data.messages || [])
            .filter((msg) => msg.role !== 'system')
            .map((msg) => ({
              id: msg._id || `msg_${msg.sequenceNumber}`,
              role: msg.role,
              content: msg.content,
              selected: false,
              // Restore interactive fields from DB
              interactiveStatus: msg.interactiveStatus,
              interactiveTitle: msg.interactiveTitle,
              interactiveSpec: msg.interactiveSpec,
            }));

          setMessages(conversationMessages);
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      };
      loadMessages();
    }
  }, [chatId, refreshTrigger]);

  // --- RAG HANDLERS START ---
  const handleComposerChange = useCallback((e) => {
    const text = e.target.value;
    setComposerText(text);

    // Only check for slash if text length is small (early exit optimization)
    // This prevents expensive operations during normal typing
    if (text.length <= 50 && text.startsWith('/')) {
      setShowSlashMenu(true);
      setSelectedMenuIndex(0);
    } else if (text.length > 0 && !text.startsWith('/')) {
      // Close menu if slash was removed or text doesn't start with /
      setShowSlashMenu(false);
    }
  }, []);

  const handleComposerKeyDown = useCallback((e) => {
    // Handle slash menu navigation
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
        const command = RAG_SLASH_COMMANDS[selectedMenuIndex];
        if (command) {
          // Use the same logic as handleSelectSlashCommand
          if (command.source === null) {
            setRagSources(RAG_CONTENT_TYPES);
          } else {
            setRagSources([command.source]);
          }
          setComposerText('');
          setShowSlashMenu(false);
          setSelectedMenuIndex(0);
          composerInputRef.current?.focus();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    // Handle send message with Ctrl/Cmd+Enter or just Enter
    if ((e.key === 'Enter' && !e.shiftKey) || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      // Inline the send logic instead of calling another function
      if (composerText.trim() && !isLoading) {
        handleSendMessage();
      }
    }
  }, [showSlashMenu, selectedMenuIndex, composerText, isLoading]);

  const toggleRagMenu = useCallback(() => {
    setShowSlashMenu((prev) => !prev);
    setSelectedMenuIndex(0);
    // Defer focus to next frame to avoid conflicts
    requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });
  }, []);

  const handleSelectSlashCommand = useCallback((command) => {
    if (command.source === null) {
      // '/context-all' - use all sources
      setRagSources(RAG_CONTENT_TYPES);
    } else {
      // Single source
      setRagSources([command.source]);
    }

    // Close slash menu
    setShowSlashMenu(false);

    // Remove the slash command from the message text
    const messageWithoutSlash = composerText
      .replace(/^\/[\w\-]+\s*/, '')
      .trim();
    setComposerText(messageWithoutSlash);

    // Refocus input
    composerInputRef.current?.focus();
  }, [composerText]);
  // --- RAG HANDLERS END ---

  const handleSendMessage = useCallback(async () => {
    if (!composerText.trim()) return;

    let activeChatId = chatId;

    // Auto-create chat if none selected
    if (!activeChatId) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/secondStage/new-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: composerText.trim().substring(0, 40) }),
        });
        if (!res.ok) throw new Error('Failed to auto-create chat');
        const data = await res.json();
        activeChatId = data.chatId;

        // Notify parent layout (like Sidebar) that data changed
        onDataSaved();

        // Update the URL to reflect the new chat without full refresh
        router.replace(`/secondStage/${activeChatId}`);
      } catch (err) {
        console.error('Auto-create error:', err);
        alert('Failed to create a new chat session. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // --- INTERACTIVE INTERCEPT START ---
    if (isInteractiveQuery) {
      const rawQuery = composerText.trim();
      const titleRaw = rawQuery.replace(/@interactive\s*/i, '').trim();
      const title = titleRaw.slice(0, 80) || 'Interactive Explainer';

      setComposerText('');

      try {
        // 1. Save USER message to DB
        const userRes = await fetch('/api/secondStage/message/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: activeChatId, role: 'user', content: rawQuery }),
        });
        const userData = await userRes.json();

        const userMsg = {
          id: userData.messageId || `msg_${Date.now()}`,
          role: 'user',
          content: rawQuery,
          selected: false,
        };
        setMessages((prev) => [...prev, userMsg]);

        // 2. Save PENDING interactive message to DB
        const interactiveRes = await fetch('/api/secondStage/message/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            role: 'interactive',
            content: `Interactive session: ${title}`,
            interactiveStatus: 'pending',
            interactiveTitle: title
          }),
        });
        const interactiveData = await interactiveRes.json();
        const interactiveCardId = interactiveData.messageId;

        const pendingCard = {
          id: interactiveCardId || `interactive_${Date.now()}`,
          role: 'interactive',
          interactiveStatus: 'pending',
          interactiveTitle: title,
          interactiveSpec: null,
        };
        setMessages((prev) => [...prev, pendingCard]);

        // Store official DB ID for the patching hook
        activeInteractiveCardIdRef.current = interactiveCardId;

        // 3. Kick off generation
        generateInteractive({ query: rawQuery, title, mode: 'spec' });
      } catch (err) {
        console.error('INTERACTIVE: Failed to initiate persisted session', err);
        // Fallback to local-only if API fails (better than nothing)
        const localId = `interactive_${Date.now()}`;
        setMessages((prev) => [...prev, {
          id: localId,
          role: 'interactive',
          interactiveStatus: 'pending',
          interactiveTitle: title,
          interactiveSpec: null
        }]);
        activeInteractiveCardIdRef.current = localId;
        generateInteractive({ query: rawQuery, title, mode: 'spec' });
      }
      setIsLoading(false);
      return;
    }
    // --- INTERACTIVE INTERCEPT END ---

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: composerText,
      selected: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = composerText;
    setComposerText('');
    setIsLoading(true);
    setShowStreamingPlaceholder(true);

    try {
      const requestBody = {
        chatId: activeChatId,
        prompt: messageToSend,
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
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.rag?.results) {
        setRagResults(data.rag.results);
      }

      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.content || 'No response',
        selected: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: `msg_${Date.now() + 2}`,
        role: 'system',
        content: `Error: ${error.message}`,
        selected: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShowStreamingPlaceholder(false);
    }
  }, [composerText, chatId, ragSources, isInteractiveQuery, generateInteractive, interactiveStatus, interactiveResult]);

  const handleToggleMessageSelection = (messageId) => {
    setSelectedMessageIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleGenerateSummary = async (mode = 'normal') => {
    if (selectedMessageIds.size === 0) return;
    setShowSummaryDialog(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/secondStage/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId || 'anonymous', messageIds: Array.from(selectedMessageIds), mode }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      onDataSaved();
      onTabChange('summary');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (selectedMessageIds.size === 0) {
      alert('Please select at least one message');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/secondStage/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId || 'anonymous', messageIds: Array.from(selectedMessageIds), provider: 'huggingface' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      const data = await response.json();
      onDataSaved();
      onTabChange('flashcards');
      alert(`Generated ${data.cards?.length || 0} flashcards!`);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuizzes = async () => {
    if (selectedMessageIds.size === 0) {
      alert('Please select at least one message');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/secondStage/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId || 'anonymous', messageIds: Array.from(selectedMessageIds), provider: 'huggingface', questionCount: 5 }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      const data = await response.json();
      onDataSaved();
      onTabChange('quizzes');
      alert(`Generated ${data.questions?.length || 0} quiz questions!`);
    } catch (error) {
      console.error('Error generating quizzes:', error);
      alert('Failed to generate quizzes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCount = () => selectedMessageIds.size;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Main content container with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area - takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Scrollable messages area */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400">Start a conversation to begin learning</p>
                </div>
              </div>
            )}

            {messages.map((message) => {
              // --- INTERACTIVE CARD RENDER START ---
              if (message.role === 'interactive') {
                return (
                  <div key={message.id} className="flex justify-center px-2 w-full my-4">
                    <div className="w-[95%] md:w-[85%] lg:w-[80%] max-w-5xl">
                      <INTERACTIVE_ChatResultCard
                        status={message.interactiveStatus}
                        title={message.interactiveTitle}
                        summary={message.interactiveSpec?.summary}
                        errorMessage={message.interactiveStatus === 'error' ? 'Generation failed. Try rephrasing your @interactive query.' : undefined}
                        onOpen={() => {
                          if (message.interactiveSpec) {
                            setOpenSpec(message.interactiveSpec);
                          }
                        }}
                        onRetry={() => {
                          resetInteractive();
                          const titleRaw = (message.interactiveTitle || 'Explainer');
                          const query = `@interactive ${titleRaw}`;

                          // Set tracking ref so the patching useEffect knows which card to update
                          activeInteractiveCardIdRef.current = message.id;

                          generateInteractive({ query, title: titleRaw, mode: 'spec' });
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id
                                ? { ...m, interactiveStatus: 'pending', interactiveSpec: null }
                                : m
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              }
              // --- INTERACTIVE CARD RENDER END ---

              return (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-center'} gap-3 w-full my-4`}>
                  <div className={`${message.role === 'user' ? 'max-w-2xl p-5' : 'w-[95%] md:w-[85%] lg:w-[80%] max-w-5xl md:px-8 px-5 py-6'} relative rounded-2xl transition-all ${message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 border border-gray-700/50'
                    } ${selectedMessageIds.has(message.id)
                      ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-950'
                      : ''
                    }`}>

                    {/* ReactMarkdown content */}
                    <div className="markdown-container text-sm md:text-base leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md border border-gray-700/50 my-4"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-black/30 rounded px-1.5 py-0.5 text-xs font-mono`} {...props}>
                                {children}
                              </code>
                            )
                          },
                          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-purple-50" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5 text-purple-100" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-4 text-purple-200" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-200" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-200" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-200" {...props} />,
                          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                          a: ({ node, ...props }) => <a className="text-purple-300 hover:text-purple-200 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500/50 pl-4 py-1 italic bg-gray-900/50 rounded-r my-4" {...props} />,
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-700 border border-gray-700" {...props} /></div>,
                          th: ({ node, ...props }) => <th className="px-3 py-2 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...props} />,
                          td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap border-t border-gray-700" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleToggleMessageSelection(message.id)}
                        className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-gray-600 flex items-center justify-center hover:border-purple-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-gray-800/50 backdrop-blur-sm"
                        aria-label="Select message for summary"
                        title="Select for summary"
                      >
                        {selectedMessageIds.has(message.id) && <span className="text-purple-400 text-sm font-bold">✓</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Streaming Placeholder */}
            {showStreamingPlaceholder && (
              <div className="flex justify-center gap-3 w-full my-4">
                <div className="w-[95%] md:w-[85%] lg:w-[80%] max-w-5xl bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 rounded-2xl p-6 border border-gray-700/50">
                  <div className="h-2 w-24 bg-purple-500/20 rounded animate-pulse" />
                  <p className="text-xs text-gray-500 mt-2">Waiting for response...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer at bottom of left area */}
          <div className="border-t border-gray-800/50 bg-gradient-to-br from-gray-900 to-gray-800 p-4 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-3">
              {/* RAG Slash Menu - positioned relative to input container */}
              <div className="flex-1 relative">
                <RagSlashMenu
                  isOpen={showSlashMenu}
                  selectedIndex={selectedMenuIndex}
                  onSelect={handleSelectSlashCommand}
                  onClose={() => setShowSlashMenu(false)}
                />

                <ChatComposer
                  ref={composerInputRef}
                  composerText={composerText}
                  onTextChange={handleComposerChange}
                  onKeyDown={handleComposerKeyDown}
                  isLoading={isLoading}
                  onSendClick={handleSendMessage}
                  showSlashMenu={showSlashMenu}
                  onToggleRagMenu={toggleRagMenu}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RAG Context Sidebar - right panel */}
        <RagContextSidebar
          ragSources={ragSources}
          ragResults={ragResults}
          isCollapsed={ragSidebarState.isCollapsed}
          onToggleCollapse={ragSidebarState.toggleCollapse}
          sidebarWidth={ragSidebarState.sidebarWidth}
          onResizeStart={ragSidebarState.startResize}
          isResizing={ragSidebarState.isResizing}
        />
      </div>

      {/* Selection Info Bar */}
      {getSelectedCount() > 0 && (
        <div className="bg-gradient-to-r from-purple-900/20 to-violet-900/20 border-t border-gray-700/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between gap-2">
          {/* ... Buttons ... */}
          <span className="text-sm text-gray-300 font-medium">{getSelectedCount()} message{getSelectedCount() > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSummaryDialog(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Generate Summary
            </button>
            <button
              onClick={() => handleGenerateFlashcards()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Generate Flashcards
            </button>
            <button
              onClick={() => handleGenerateQuizzes()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Generate Quizzes
            </button>
          </div>
        </div>
      )}

      {/* ... Summary Dialog ... */}
      {showSummaryDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* ... Dialog Content ... */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl border border-gray-700/50 p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">Generate Summary</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleGenerateSummary('normal')}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 group"
              >
                <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">Regular Summary</div>
                <div className="text-xs text-gray-400">Markdown format (150-300 words)</div>
              </button>
              <button
                onClick={() => handleGenerateSummary('incremental')}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 group"
              >
                <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">Incremental JSON</div>
                <div className="text-xs text-gray-400">Structured: key points, examples, questions</div>
              </button>
            </div>
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Generating summary...</p>
              </div>
            )}
            <button
              onClick={() => setShowSummaryDialog(false)}
              disabled={isLoading}
              className="w-full px-4 py-2 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE EXPLAINER MODAL OVERLAY ─────────────────────────── */}
      {openSpec && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="presentation"
          onClick={(e) => {
            // Close when clicking the backdrop (not the dialog itself)
            if (e.target === e.currentTarget) setOpenSpec(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <INTERACTIVE_InteractiveExplainer
              spec={openSpec}
              onClose={() => {
                console.log('INTERACTIVE: modal closed');
                setOpenSpec(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}