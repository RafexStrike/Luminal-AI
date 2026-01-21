// FILE: src/components/rag/RagSlashMenu.jsx
// DESCRIPTION: Slash command menu for selecting RAG context sources
// PURPOSE: Appears when user types "/" in chat input
//
// DESIGN PRINCIPLE: Optional UI element that appears only when user types "/"
// No changes to default behavior if not used

'use client';

import { RAG_SLASH_COMMANDS, RAG_SOURCES } from './rag.constants';

export default function RagSlashMenu({
  isOpen = false,
  selectedIndex = 0,
  onSelect = () => {},
  onClose = () => {},
}) {
  if (!isOpen) return null;

  const handleSelect = (command) => {
    onSelect(command);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Next item handled by parent
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Previous item handled by parent
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(RAG_SLASH_COMMANDS[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="absolute top-0 left-0 -translate-y-full -mb-2 w-56 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-50 overflow-hidden"
      onKeyDown={handleKeyDown}
      role="menu"
    >
      <div className="p-2">
        <p className="text-xs text-purple-400 font-semibold px-2 py-1">
          📌 ENHANCE WITH CONTEXT
        </p>

        {RAG_SLASH_COMMANDS.map((cmd, idx) => {
          const source = cmd.source ? RAG_SOURCES[cmd.source] : null;
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={cmd.command}
              onClick={() => handleSelect(cmd)}
              className={`w-full text-left px-3 py-2.5 rounded transition-colors ${
                isSelected
                  ? 'bg-purple-600/30 border-l-2 border-purple-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
              role="menuitem"
              aria-selected={isSelected}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {source ? `${source.icon} ${cmd.label}` : `🌐 ${cmd.label}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {source ? source.description : 'Search all sources'}
                  </div>
                </div>
                <div className="text-xs text-purple-400 ml-2 mt-0.5">
                  {cmd.shortcut}
                </div>
              </div>
            </button>
          );
        })}

        <div className="border-t border-gray-700 mt-2 pt-2">
          <p className="text-xs text-gray-400 px-2 py-1 leading-relaxed">
            💡 Type <code className="bg-gray-700/50 px-1 py-0.5 rounded text-purple-300">/</code> or click the icon to see options
          </p>
        </div>
      </div>
    </div>
  );
}
