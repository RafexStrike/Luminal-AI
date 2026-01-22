/**
 * Component to display individual RAG result cards
 * Shows a single retrieved document (flashcard, quiz item, note, etc.)
 */
export function RagResultCard({ result, index }) {
  const sourceIcons = {
    flashcard: '🎴',
    quiz: '❓',
    note: '📝',
  };

  const sourceColors = {
    flashcard: 'border-blue-500/30 bg-blue-500/5',
    quiz: 'border-purple-500/30 bg-purple-500/5',
    note: 'border-green-500/30 bg-green-500/5',
  };

  const icon = sourceIcons[result.sourceType] || '📄';
  const borderColor = sourceColors[result.sourceType] || 'border-gray-500/30 bg-gray-500/5';

  return (
    <div className={`p-3 rounded-lg border ${borderColor} transition-colors hover:border-opacity-60`}>
      {/* Header with icon, type, and similarity score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {result.sourceType}
            </div>
            {result.metadata?.difficulty && (
              <div className="text-xs text-gray-500">
                Difficulty: {result.metadata.difficulty}
              </div>
            )}
          </div>
        </div>

        {/* Similarity score badge */}
        <div className="flex-shrink-0 px-2 py-1 rounded bg-gray-900/50 border border-gray-700/50">
          <span className="text-xs font-mono text-gray-300">
            {(result.similarity * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Content preview */}
      <div className="text-sm text-gray-300 line-clamp-3 mb-2">
        {result.text}
      </div>

      {/* Tags/metadata if available */}
      {result.metadata?.tags && result.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {result.metadata.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded bg-gray-800/50 border border-gray-700/30 text-gray-400"
            >
              {tag}
            </span>
          ))}
          {result.metadata.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{result.metadata.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
