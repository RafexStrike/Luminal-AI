// FILE: src/components/SECONDARY_ChatSidebar.jsx
// DESCRIPTION: Collapsible sidebar with space management, recents, and toggle button

'use client';

import { useState } from 'react';

/**
 * SECONDARY_ChatSidebar
 * 
 * Features:
 *   - Collapse/expand toggle button (top-left)
 *   - "Create Space" button
 *   - Recents list (placeholder)
 *   - Click space item to select it (calls onSelectSpace)
 * 
 * Collapse behavior:
 *   - When collapsed: sidebar width shrinks to ~60px, only icons visible
 *   - State persisted to localStorage key: youlearn_stage2_sidebar_collapsed
 *   - Toggle via handleToggleCollapse prop
 */
export default function SECONDARY_ChatSidebar({
  collapsed = false,
  onToggleCollapse = () => {},
  onSelectSpace = () => {},
}) {
  const [recents, setRecents] = useState([
    { id: '1', name: 'Physics 101' },
    { id: '2', name: 'Biology Notes' },
    { id: '3', name: 'History Revision' },
  ]);

  const handleCreateSpace = () => {
    // TODO: Implement create space modal/form
    const newSpace = {
      id: Date.now().toString(),
      name: 'New Space',
    };
    setRecents([newSpace, ...recents]);
    onSelectSpace(newSpace.id);
  };

  return (
    <div
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && <h2 className="text-lg font-bold text-gray-900">YouLearn</h2>}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Create Space Button */}
      <div className="p-3">
        <button
          onClick={handleCreateSpace}
          className={`w-full flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label="Create new space"
        >
          <span className="text-lg">+</span>
          {!collapsed && 'Create Space'}
        </button>
      </div>

      {/* Recents Section */}
      {!collapsed && (
        <div className="flex-1 overflow-auto px-3 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Recents</div>
          <div className="space-y-2">
            {recents.map((space) => (
              <button
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm truncate"
                title={space.name}
              >
                📚 {space.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed View - Icon Stack */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <div className="text-2xl cursor-pointer hover:opacity-70" title="Recents">
            🕐
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 text-center">
        {collapsed ? (
          <div className="text-2xl">👤</div>
        ) : (
          <div className="text-xs text-gray-500">Anonymous User</div>
        )}
      </div>
    </div>
  );
}
