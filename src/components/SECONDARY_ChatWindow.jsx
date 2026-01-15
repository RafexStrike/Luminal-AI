// FILE: src/components/SECONDARY_ChatWindow.jsx
// DESCRIPTION: Chat display and message composer; handles message selection, streaming, and summary generation

'use client';

import { useState, useRef, useEffect } from 'react';
import theme from '../design/theme.config';
import chat from '../design/chat.config';

/**
 * SECONDARY_ChatWindow
 *
 * - Keeps existing backend interactions intact
 * - Uses global.css design tokens and purple accent theme
 * - All logic remains unchanged
 */
export default function SECONDARY_ChatWindow({
  chatId = null,
  onDataSaved = () => {},
  onTabChange = () => {},
  refreshTrigger = 0,
}) {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showStreamingPlaceholder, setShowStreamingPlaceholder] = useState(false);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when chatId changes
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
          // Filter out system message and convert to component format
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
    setIsLoading(true);
    setShowStreamingPlaceholder(true);

    try {
      const response = await fetch('/api/secondStage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, prompt: composerText, stream: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
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
  };

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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Summary generated:', data);
      onDataSaved();
      // Navigate to summary tab
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
        body: JSON.stringify({
          chatId: chatId || 'anonymous',
          messageIds: Array.from(selectedMessageIds),
          provider: 'huggingface',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Flashcards generated:', data);
      onDataSaved();
      // Navigate to flashcards tab
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
        body: JSON.stringify({
          chatId: chatId || 'anonymous',
          messageIds: Array.from(selectedMessageIds),
          provider: 'huggingface',
          questionCount: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Quizzes generated:', data);
      onDataSaved();
      // Navigate to quizzes tab
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
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Start a conversation to begin learning</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
            {/* Message Container */}
            <div className={`${chat.messageMaxWidth} p-4 relative rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border border-border'} ${selectedMessageIds.has(message.id) ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}>
              {message.content}

              {/* Selection Checkbox for Assistant Messages */}
              {message.role === 'assistant' && (
                <button 
                  onClick={() => handleToggleMessageSelection(message.id)} 
                  className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-border flex items-center justify-center hover:border-purple-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                  aria-label="Select message for summary" 
                  title="Select for summary"
                >
                  {selectedMessageIds.has(message.id) && <span className="text-purple-500 text-sm">✓</span>}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Placeholder */}
        {showStreamingPlaceholder && (
          <div className="flex justify-start gap-3">
            <div className="bg-muted text-muted-foreground rounded-lg p-4 max-w-md border border-border">
              <div className="h-2 bg-muted-foreground/20 rounded animate-pulse" />
              <p className="text-xs text-muted-foreground mt-2">Waiting for response</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selection Info Bar */}
      {getSelectedCount() > 0 && (
        <div className="bg-accent/10 border-t border-border px-6 py-3 flex items-center justify-between gap-2">
          <span className="text-sm text-foreground">{getSelectedCount()} message{getSelectedCount() > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSummaryDialog(true)} 
              className="px-4 py-2 gradient-purple text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Generate Summary
            </button>
            <button 
              onClick={() => handleGenerateFlashcards()} 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Generate Flashcards
            </button>
            <button 
              onClick={() => handleGenerateQuizzes()} 
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Generate Quizzes
            </button>
          </div>
        </div>
      )}

      {/* Summary Dialog */}
      {showSummaryDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Generate Summary</h3>
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => handleGenerateSummary('normal')} 
                disabled={isLoading} 
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-border hover:border-purple-500 hover:bg-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="font-semibold text-foreground">Regular Summary</div>
                <div className="text-xs text-muted-foreground">Markdown format (150-300 words)</div>
              </button>
              <button 
                onClick={() => handleGenerateSummary('incremental')} 
                disabled={isLoading} 
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-border hover:border-purple-500 hover:bg-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="font-semibold text-foreground">Incremental JSON</div>
                <div className="text-xs text-muted-foreground">Structured: key points, examples, questions</div>
              </button>
            </div>
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Generating summary...</p>
              </div>
            )}
            <button 
              onClick={() => setShowSummaryDialog(false)} 
              disabled={isLoading} 
              className="w-full px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-input">
            {/* Placeholder buttons (kept minimal and accessible) */}
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" 
              title="Attach file" 
              aria-label="Attach"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05L12.98 19.5a5 5 0 01-7.07-7.07l7.07-7.07a3 3 0 114.24 4.24L9.56 17.94" />
              </svg>
            </button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={composerText} 
              onChange={(e) => setComposerText(e.target.value)} 
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  handleSendMessage(); 
                }
              }} 
              className="flex-1 outline-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none" 
            />
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" 
              title="Voice input" 
              aria-label="Voice"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11" />
              </svg>
            </button>
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" 
              title="Add context" 
              aria-label="Context"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </button>
          </div>
          <button 
            onClick={handleSendMessage} 
            disabled={!composerText.trim() || isLoading} 
            className="px-6 py-2 gradient-purple text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}