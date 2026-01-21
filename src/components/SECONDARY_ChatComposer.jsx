// FILE: src/components/SECONDARY_ChatComposer.jsx
// DESCRIPTION: Memoized chat composer to prevent unnecessary re-renders
// PURPOSE: Isolates textarea and input handlers from parent re-renders

'use client';

import { memo, forwardRef } from 'react';

const ChatComposer = memo(
  forwardRef(function ChatComposer(
    {
      composerText,
      onTextChange,
      onKeyDown,
      isLoading,
      onSendClick,
      showSlashMenu,
      onToggleRagMenu,
    },
    ref
  ) {
    return (
      <>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50 focus-within:border-purple-500/50 transition-colors">
          {/* Attach button */}
          <button
            className="p-2 text-gray-500 hover:text-purple-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            title="Attach file"
            aria-label="Attach"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21.44 11.05L12.98 19.5a5 5 0 01-7.07-7.07l7.07-7.07a3 3 0 114.24 4.24L9.56 17.94"
              />
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={ref}
            placeholder="Type / for context options... or just start typing (shift+enter for new line)"
            value={composerText}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            className="flex-1 outline-none bg-transparent text-white placeholder:text-gray-500 focus-visible:outline-none resize-none min-h-[40px] max-h-[120px]"
            rows="1"
          />

          {/* Voice button */}
          <button
            className="p-2 text-gray-500 hover:text-purple-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            title="Voice input"
            aria-label="Voice"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 1v11"
              />
            </svg>
          </button>

          {/* Add context button */}
          <button
            className="p-2 text-gray-500 hover:text-purple-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            title="Add context"
            aria-label="Context"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>

        {/* Manual Context Button */}
        <button
          onClick={onToggleRagMenu}
          title={showSlashMenu ? 'Close context menu' : 'Open context menu'}
          className={`p-2 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
            showSlashMenu
              ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
              : 'bg-gray-900/50 border-gray-700/50 text-gray-500 hover:text-purple-400'
          }`}
          aria-label="Toggle context menu"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={onSendClick}
          disabled={!composerText.trim() || isLoading}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          aria-label="Send message"
        >
          Send
        </button>
      </>
    );
  })
);

ChatComposer.displayName = 'ChatComposer';

export default ChatComposer;
