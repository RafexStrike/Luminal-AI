'use client';

import { RagSourceBadges } from './RagSourceBadges';
import { RagResultCard } from './RagResultCard';

/**
 * Right-side sidebar for displaying RAG context
 * Shows:
 * - Selected sources (flashcard, quiz, note, etc.)
 * - Retrieved results and similarity scores
 * - Extensible for future content types
 *
 * Props:
 * - ragSources: Array of selected source types
 * - ragResults: Array of retrieved documents with similarity scores
 * - isCollapsed: Sidebar collapse state
 * - onToggleCollapse: Callback to toggle collapse
 * - sidebarWidth: Current sidebar width in pixels
 * - onResizeStart: Callback when user starts resizing
 * - isResizing: Is resize in progress
 */
export function RagContextSidebar({
  ragSources = [],
  ragResults = [],
  isCollapsed = false,
  onToggleCollapse = () => {},
  sidebarWidth = 320,
  onResizeStart = () => {},
  isResizing = false,
  isLoading = false,
}) {
  // Don't render if no sources selected and no results
  if (ragSources.length === 0 && ragResults.length === 0) {
    return null;
  }

  return (
    <>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className={`w-1 bg-gray-800 hover:bg-purple-600 transition-colors cursor-col-resize flex-shrink-0 ${
          isResizing ? 'bg-purple-600' : ''
        }`}
        aria-label="Resize sidebar"
      />

      {/* Sidebar container */}
      <div
        style={{ width: isCollapsed ? 'auto' : `${sidebarWidth}px` }}
        className="bg-gradient-to-b from-gray-900 to-gray-950 border-l border-gray-800/50 flex flex-col transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-800/30 flex-shrink-0">
          <div className={isCollapsed ? 'hidden' : 'flex items-center gap-2 flex-1 min-w-0'}>
            <span className="text-lg">🎯</span>
            <h3 className="text-sm font-semibold text-gray-200 truncate">RAG Context</h3>
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded hover:bg-gray-800/50 transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span className="text-lg">
              {isCollapsed ? '‹' : '›'}
            </span>
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Selected Sources Section */}
            {ragSources.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sources
                </h4>
                <RagSourceBadges sources={ragSources} isLoading={isLoading} />
              </div>
            )}

            {/* Results Section */}
            {ragResults.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Retrieved Context ({ragResults.length})
                </h4>
                <div className="space-y-2">
                  {ragResults.map((result, index) => (
                    <RagResultCard key={index} result={result} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {ragSources.length > 0 && ragResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
                <span className="text-2xl mb-2">🔍</span>
                <p className="text-sm text-gray-500">
                  No matching content found
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Retrieved results will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center">
            <span className="text-lg mb-2">🎯</span>
            {ragResults.length > 0 && (
              <span className="text-xs font-bold text-purple-400 bg-purple-500/20 rounded px-2 py-1">
                {ragResults.length}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
