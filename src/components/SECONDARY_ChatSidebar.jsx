// FILE: src/components/SECONDARY_ChatSidebar.jsx
// DESCRIPTION: Collapsible sidebar with collections, chat management, and context menu

'use client';

import { useState, useEffect, useRef } from 'react';
import theme from '../design/theme.config';
import layout from '../design/layout.config';
import { groupByCollection, getCollectionNames } from '../lib/collection-utils';

/**
 * ChatContextMenu
 * Three-dot menu for chat operations (rename, move, delete)
 */
function ChatContextMenu({ chat, onRename, onMove, onDelete, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-max"
      role="menu"
    >
      <button
        onClick={() => {
          onRename(chat);
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-900/30 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        role="menuitem"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Rename
      </button>
      <button
        onClick={() => {
          onMove(chat);
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-900/30 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        role="menuitem"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        Add to collection
      </button>
      <hr className="border-gray-700 my-1" />
      <button
        onClick={() => {
          onDelete(chat);
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        role="menuitem"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  );
}

/**
 * RenameModal
 * Modal for renaming a chat
 */
function RenameModal({ chat, onConfirm, onCancel, isLoading }) {
  const [value, setValue] = useState(chat?.title || '');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Rename Chat</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 mb-4"
          placeholder="Enter new title..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MoveToCollectionModal
 * Modal for moving a chat to a collection
 */
function MoveToCollectionModal({ chat, existingCollections, onConfirm, onCancel, isLoading }) {
  const [selectedCollection, setSelectedCollection] = useState(chat?.collection || 'Unknown');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [mode, setMode] = useState('select'); // 'select' or 'create'

  const handleSubmit = () => {
    const collectionName = mode === 'create' ? newCollectionName.trim() : selectedCollection;
    if (collectionName) {
      onConfirm(collectionName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Move to Collection</h3>

        {mode === 'select' && (
          <>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 mb-4"
            >
              {existingCollections.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <div className="text-center mb-4">
              <button
                onClick={() => setMode('create')}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                or create a new collection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                {isLoading ? 'Moving...' : 'Move'}
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 mb-4"
              placeholder="Collection name..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !newCollectionName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setMode('select')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * DeleteConfirmModal
 * Confirmation dialog for deleting a chat
 */
function DeleteConfirmModal({ chat, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">Delete Chat?</h3>
        <p className="text-gray-400 mb-6 text-sm">
          Are you sure you want to delete "<span className="font-medium">{chat?.title || 'Untitled'}</span>"? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CollectionSection
 * Collapsible section showing chats in a collection
 */
function CollectionSection({ collection, onSelectChat, onShowMenu, selectedChatId, onError }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleMenuClick = (e, chat) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onShowMenu(chat, {
      top: rect.bottom + 5,
      left: rect.left,
    });
  };

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase text-gray-400 hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        aria-expanded={isExpanded}
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {collection.name} <span className="text-gray-500">({collection.count})</span>
      </button>

      {isExpanded && (
        <div className="space-y-1 pl-2">
          {collection.chats.map((chat) => (
            <div key={chat._id} className="relative group">
              <button
                onClick={() => onSelectChat(chat._id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  selectedChatId === chat._id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-200 bg-gray-900/40 hover:bg-purple-900/30'
                }`}
                title={chat.title}
              >
                {chat.title || 'Untitled Chat'}
              </button>
              <button
                onClick={(e) => handleMenuClick(e, chat)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                aria-label={`Options for ${chat.title}`}
                title="Chat options"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SECONDARY_ChatSidebar
 * Main sidebar component with collections grouping
 */
export default function SECONDARY_ChatSidebar({
  collapsed = false,
  onToggleCollapse = () => {},
  onSelectSpace = () => {},
  currentChatId = null,
  onChatDeleted = () => {},
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [renameModal, setRenameModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
  const [isOperating, setIsOperating] = useState(false);
  const [toast, setToast] = useState(null);

  // Load chats on mount
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
              const firstMsg = (d.messages || []).find(
                (m) => m.role === 'user' || m.role === 'assistant'
              );
              if (firstMsg && firstMsg.content) {
                const words = firstMsg.content.trim().split(/\s+/).slice(0, 7).join(' ');
                setChats((prev) =>
                  prev.map((p) => (p._id === c._id ? { ...p, title: words } : p))
                );
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

  const handleRenameClick = (chat) => {
    setContextMenu(null);
    setRenameModal(chat);
  };

  const handleMoveClick = (chat) => {
    setContextMenu(null);
    setMoveModal(chat);
  };

  const handleDeleteClick = (chat) => {
    setContextMenu(null);
    setDeleteModal(chat);
  };

  const handleRenameConfirm = async (newTitle) => {
    try {
      setIsOperating(true);
      const res = await fetch('/api/secondStage/chat_operations/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: renameModal._id, title: newTitle }),
      });

      if (!res.ok) throw new Error('Failed to rename chat');
      const data = await res.json();

      setChats((prev) =>
        prev.map((c) => (c._id === renameModal._id ? { ...c, title: data.data.title } : c))
      );
      setRenameModal(null);
      setToast({ type: 'success', message: 'Chat renamed successfully.' });
    } catch (err) {
      console.error('Rename error:', err);
      setToast({ type: 'error', message: 'Failed to rename chat.' });
    } finally {
      setIsOperating(false);
    }
  };

  const handleMoveConfirm = async (collectionName) => {
    try {
      setIsOperating(true);
      const res = await fetch('/api/secondStage/chat_operations/set-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: moveModal._id, collection: collectionName }),
      });

      if (!res.ok) throw new Error('Failed to move chat');
      const data = await res.json();

      setChats((prev) =>
        prev.map((c) => (c._id === moveModal._id ? { ...c, collection: data.data.collection } : c))
      );
      setMoveModal(null);
      setToast({ type: 'success', message: `Chat moved to "${collectionName}".` });
    } catch (err) {
      console.error('Move error:', err);
      setToast({ type: 'error', message: 'Failed to move chat.' });
    } finally {
      setIsOperating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsOperating(true);
      const res = await fetch('/api/secondStage/chat_operations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: deleteModal._id }),
      });

      if (!res.ok) throw new Error('Failed to delete chat');

      setChats((prev) => prev.filter((c) => c._id !== deleteModal._id));
      setDeleteModal(null);

      // If deleted chat is currently open, notify parent
      if (deleteModal._id === currentChatId) {
        onChatDeleted(deleteModal._id);
      }

      setToast({ type: 'success', message: 'Chat deleted.' });
    } catch (err) {
      console.error('Delete error:', err);
      setToast({ type: 'error', message: 'Failed to delete chat.' });
    } finally {
      setIsOperating(false);
    }
  };

  const collections = groupByCollection(chats);
  const collectionNames = getCollectionNames(chats);

  return (
    <div
      className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 text-white border-r border-gray-800/50 transition-all duration-300 ${
        collapsed ? layout.sidebar.width.collapsed : layout.sidebar.width.expanded
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800/50">
        {!collapsed && (
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Luminal AI
          </h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-purple-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
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
      <div className="px-4 py-3">
        <button
          onClick={handleCreateSpace}
          disabled={isOperating}
          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label="Create new chat"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
          {!collapsed && 'Create Chat'}
        </button>
      </div>

      {/* Error Message */}
      {error && !collapsed && (
        <div className="mx-3 mt-2 p-3 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Chat List by Collections */}
      {!collapsed && (
        <div className="flex-1 overflow-auto px-3 py-4">
          {loading ? (
            <div className="text-sm text-gray-500 px-2">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="text-sm text-gray-500 px-2">
              No chats yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <CollectionSection
                  key={collection.name}
                  collection={collection}
                  onSelectChat={onSelectSpace}
                  onShowMenu={(chat, pos) => {
                    setContextMenu(chat);
                    setContextMenuPos(pos);
                  }}
                  selectedChatId={currentChatId}
                  onError={(msg) => setToast({ type: 'error', message: msg })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed View - Minimal Icons */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <div className="cursor-pointer text-gray-400 hover:text-purple-400 transition-colors" title="Chats">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.7 9.7 0 01-4-.8L3 20l1.2-3A7.5 7.5 0 013 12c0-4.42 4.03-8 9-8s9 3.58 9 8z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-800/50 px-4 py-3 text-center">
        {collapsed ? null : (
          <div className="text-xs text-gray-500">Anonymous User</div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-40" style={{ top: `${contextMenuPos.top}px`, left: `${contextMenuPos.left}px` }}>
          <ChatContextMenu
            chat={contextMenu}
            onRename={handleRenameClick}
            onMove={handleMoveClick}
            onDelete={handleDeleteClick}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <RenameModal
          chat={renameModal}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameModal(null)}
          isLoading={isOperating}
        />
      )}

      {/* Move to Collection Modal */}
      {moveModal && (
        <MoveToCollectionModal
          chat={moveModal}
          existingCollections={collectionNames}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveModal(null)}
          isLoading={isOperating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmModal
          chat={deleteModal}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          isLoading={isOperating}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 left-4 px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${
            toast.type === 'error'
              ? 'bg-red-900/80 text-red-100'
              : 'bg-green-900/80 text-green-100'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
