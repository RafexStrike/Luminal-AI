// FILE: src/components/SECONDARY_ChatSidebar.jsx
// DESCRIPTION: Collapsible sidebar with space management, recents, and toggle button

'use client';

import { useState, useEffect } from 'react';
import theme from '../design/theme.config';
import layout from '../design/layout.config';

/**
 * SECONDARY_ChatSidebar
 *
 * Responsibilities:
 *  - Fetch and list user's chats (GET /api/secondStage/chats)
 *  - Allow creating a new chat (POST /api/secondStage/new-chat)
 *  - Notify parent when a chat is selected via onSelectSpace
 */
export default function SECONDARY_ChatSidebar({
  collapsed = false,
  onToggleCollapse = () => {},
  onSelectSpace = () => {},
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadChats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/secondStage/chats');

        // Always attempt to read response body to provide better error messages
        let textBody = null;
        try {
          textBody = await res.text();
        } catch (e) {
          textBody = null;
        }

        let data = {};
        if (textBody) {
          try {
            data = JSON.parse(textBody);
          } catch (e) {
            data = { raw: textBody };
          }
        }

        if (!res.ok) {
          const status = res.status;
          const serverMsg = data?.error || data?.message || data?.raw || `HTTP ${status}`;
          console.log('Chat fetch status:', res.status, data);

          throw new Error(`Failed to load chats: ${serverMsg}`);
          
        }

        const loaded = data.chats || [];
        if (mounted) setChats(loaded);

        // Enhance titles for 'New Chat' / missing titles by fetching a snippet from history
        const toEnhance = loaded.filter((c) => !c.title || c.title === 'New Chat').slice(0, 6);
        await Promise.all(
          toEnhance.map(async (c) => {
            try {
              const r = await fetch(`/api/secondStage/chat-history?chatId=${c._id}`);
              if (!r.ok) return null;
              const d = await r.json();
              const firstMsg = (d.messages || []).find((m) => m.role === 'user' || m.role === 'assistant');
              if (firstMsg && firstMsg.content) {
                const words = firstMsg.content.trim().split(/\s+/).slice(0, 7).join(' ');
                // Update state with derived title
                setChats((prev) => prev.map((p) => (p._id === c._id ? { ...p, title: words } : p)));
              }
            } catch (e) {
              // ignore
            }
          })
        );
      } catch (err) {
        console.error('Error loading chats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChats();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateSpace = async () => {
    try {
      const res = await fetch('/api/secondStage/new-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error('Failed to create chat');
      const data = await res.json();
      const newChat = { _id: data.chatId, title: data.title || 'New Chat' };
      setChats((prev) => [newChat, ...prev]);
      onSelectSpace(newChat._id);
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Could not create new chat.');
    }
  };

  return (
    <div
      className={`flex flex-col ${theme.colors.panel} ${theme.colors.border} transition-all duration-300 ${collapsed ? layout.sidebar.width.collapsed : layout.sidebar.width.expanded}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${layout.sidebar.padding} border-b ${theme.colors.border}`}>
        {!collapsed && <h2 className={`${theme.typography.heading} ${theme.colors.text}`}>YouLearn</h2>}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Create Chat Button */}
      <div className={layout.sidebar.padding}>
        <button
          onClick={handleCreateSpace}
          className={`w-full flex items-center gap-2 px-3 py-2 ${theme.colors.accentBg} ${theme.colors.accent} ${theme.radius.base} hover:opacity-95 transition-colors font-medium ${collapsed ? 'justify-center' : ''}`}
          aria-label="Create new chat"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
          {!collapsed && 'Create Chat'}
        </button>
      </div>

      {/* Chat List */}
      {!collapsed && (
        <div className="flex-1 overflow-auto px-3 py-4">
          <div className={`${theme.typography.muted} font-semibold uppercase mb-3 ${theme.colors.muted}`}>Chats</div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="text-sm text-gray-500">No chats yet. Create one to get started.</div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => onSelectSpace(chat._id)}
                  className={`w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 ${theme.radius.base} transition-colors text-sm ${theme.typography.body} ${chat.title ? 'truncate' : ''}`}
                  title={chat.title}
                >
                  {chat.title || 'Untitled Chat'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed View - Minimal Icons */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <div className="cursor-pointer hover:opacity-70" title="Chats">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.7 9.7 0 01-4-.8L3 20l1.2-3A7.5 7.5 0 013 12c0-4.42 4.03-8 9-8s9 3.58 9 8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`border-t ${theme.colors.border} ${layout.sidebar.padding} text-center`}>
        {collapsed ? (
          <div className={theme.radius.full} />
        ) : (
          <div className={`${theme.typography.muted} ${theme.colors.muted}`}>Anonymous User</div>
        )}
      </div>
    </div>
  );
}
