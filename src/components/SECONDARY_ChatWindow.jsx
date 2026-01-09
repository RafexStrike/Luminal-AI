// FILE: src/components/SECONDARY_ChatWindow.jsx
// DESCRIPTION: Chat display and message composer; handles message selection, streaming, and summary generation

'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * SECONDARY_ChatWindow
 * 
 * Features:
 *   - Display messages (user and assistant)
 *   - Select assistant messages (toggle with checkbox)
 *   - Streaming message display (placeholder for token streaming)
 *   - Message composer with placeholder buttons (Attach, Voice, Add Context)
 *   - "Generate Summary" button (disabled if no messages selected)
 *   - Summary generation dialog (normal or incremental JSON)
 * 
 * State:
 *   - messages: array of { id, role, content, streaming, selected }
 *   - selectedMessageIds: Set of message IDs selected for summary generation
 *   - composerText: draft message content
 *   - showSummaryDialog: boolean for summary options modal
 * 
 * Data flow:
 *   - User types message in composer
 *   - Click "Send" -> POST /api/secondStage/chat with { provider, apiKey, messages }
 *   - Response streams or returns full JSON
 *   - User clicks checkbox on assistant message -> add to selectedMessageIds
 *   - Click "Generate Summary" -> show dialog with "Normal" or "Incremental JSON" options
 *   - Selected option -> POST /api/secondStage/summary { messageIds, mode }
 *   - Result saved to DB and displayed
 */
export default function SECONDARY_ChatWindow({
  chatId = null,
  onDataSaved = () => {},
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

  // TODO: Load chat history from DB on chatId change
  useEffect(() => {
    if (chatId) {
      // Fetch chat messages from API
      // const loadMessages = async () => { ... }
    }
  }, [chatId, refreshTrigger]);

  const handleSendMessage = async () => {
    if (!composerText.trim()) return;

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
      // TODO: Get provider and apiKey from user settings (currently placeholder)
      const provider = localStorage.getItem('youlearn_provider') || 'openai';
      const apiKey = localStorage.getItem('youlearn_apikey') || '';

      const response = await fetch('/api/secondStage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          messages: [
            ...messages,
            userMessage,
          ].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false, // TODO: enable streaming support
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
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
      // Show error to user
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
        body: JSON.stringify({
          chatId: chatId || 'anonymous',
          messageIds: Array.from(selectedMessageIds),
          mode, // 'normal' or 'incremental'
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Summary generated:', data);
      onDataSaved();
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCount = () => selectedMessageIds.size;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p>Start a conversation to begin learning</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
          >
            {/* Message Container */}
            <div
              className={`max-w-md rounded-lg p-4 relative ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${
                selectedMessageIds.has(message.id)
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : ''
              }`}
            >
              {message.content}

              {/* Selection Checkbox for Assistant Messages */}
              {message.role === 'assistant' && (
                <button
                  onClick={() => handleToggleMessageSelection(message.id)}
                  className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors"
                  aria-label="Select message for summary"
                  title="Select for summary"
                >
                  {selectedMessageIds.has(message.id) && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Placeholder */}
        {showStreamingPlaceholder && (
          <div className="flex justify-start gap-3">
            <div className="bg-gray-100 text-gray-900 rounded-lg p-4 max-w-md">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Streaming tokens...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selection Info Bar */}
      {getSelectedCount() > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {getSelectedCount()} message{getSelectedCount() > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setShowSummaryDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Generate Summary
          </button>
        </div>
      )}

      {/* Summary Dialog */}
      {showSummaryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Generate Summary</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleGenerateSummary('normal')}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold">Regular Summary</div>
                <div className="text-xs text-gray-500">Markdown format (150-300 words)</div>
              </button>
              <button
                onClick={() => handleGenerateSummary('incremental')}
                className="w-full px-4 py-3 text-left rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold">Incremental JSON</div>
                <div className="text-xs text-gray-500">Structured: key points, examples, questions</div>
              </button>
            </div>
            <button
              onClick={() => setShowSummaryDialog(false)}
              className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-300">
            {/* Placeholder buttons */}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Attach file"
              aria-label="Attach"
            >
              📎
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
              className="flex-1 outline-none bg-transparent text-gray-900"
            />
            <button
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Voice input"
              aria-label="Voice"
            >
              🎤
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Add context"
              aria-label="Context"
            >
              🔗
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!composerText.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
