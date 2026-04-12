// FILE: src/components/SECONDARY_ChatComposer.jsx
// DESCRIPTION: Memoized chat composer to prevent unnecessary re-renders
// PURPOSE: Isolates textarea and input handlers from parent re-renders

'use client';

import { memo, forwardRef, useEffect, useRef } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      isInteractiveQuery, // New prop for interactive query indicator
    },
    ref
  ) {
    const internalTextareaRef = useRef(null);

    // Sync the forwarded ref with our internal ref
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(internalTextareaRef.current);
      } else {
        ref.current = internalTextareaRef.current;
      }
    }, [ref]);

    // Auto-resize textarea
    useEffect(() => {
      if (internalTextareaRef.current) {
        internalTextareaRef.current.style.height = 'auto';
        internalTextareaRef.current.style.height = `${Math.min(internalTextareaRef.current.scrollHeight, 250)}px`;
      }
    }, [composerText]);

    return (
      <div className="flex items-end gap-3 w-full">
        {/* Context Button */}
         <button
           onClick={onToggleRagMenu}
           title={showSlashMenu ? 'Close context menu' : 'Open context menu'}
           className={`flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${showSlashMenu
             ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
             : 'bg-gray-800/80 border-gray-700/80 hover:border-indigo-500/50 text-gray-400 hover:text-indigo-400'
             }`}
           aria-label="Toggle context menu"
         >
          {/* Meaningful icon: database / layers / context */}
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </button>

        {/* Input Wrapper */}
         <div className="flex-1 relative flex items-center bg-gray-900/60 rounded-xl border border-gray-700/50 focus-within:border-indigo-500/80 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all">
          <textarea
            ref={internalTextareaRef}
            placeholder="Type / for context options... or just start typing (shift+enter for new line)"
            value={composerText}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent text-white placeholder:text-gray-500 border-none outline-none resize-none min-h-[52px] max-h-[250px] py-3.5 px-5 rounded-xl leading-relaxed text-base"
            rows="1"
            disabled={isInteractiveQuery}
          />
           {isInteractiveQuery && (
             <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/30 text-indigo-300 text-sm font-medium rounded-xl pointer-events-none">
               @interactive
             </div>
           )}
           {isInteractiveQuery && (
             <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full">
               AI
             </span>
           )}
        </div>

        {/* Send button */}
         <button
           onClick={onSendClick}
           disabled={!composerText.trim() || isLoading || isInteractiveQuery}
           className="flex-shrink-0 px-6 h-[52px] bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center justify-center gap-2"
           aria-label="Send message"
         >
          {isLoading ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <>
              Send
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}

        </button>
      </div>
    );
  })
);

ChatComposer.displayName = 'ChatComposer';

export default ChatComposer;
