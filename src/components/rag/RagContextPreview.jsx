// FILE: src/components/rag/RagContextPreview.jsx
// DESCRIPTION: Displays retrieved context before sending message
// PURPOSE: Allows user to see what RAG found before the LLM sees it
//
// OPTIONAL UI: Only shown if RAG retrieval succeeds and user wants to preview

'use client';

import { getSimilarityLevel } from './rag.constants';

export default function RagContextPreview({
  results = [],
  isLoading = false,
  onDismiss = () => {},
}) {
  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin">⟳</div>
          <span className="text-sm text-blue-700">
            Searching your context...
          </span>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  // Group results by source type
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.sourceType]) {
      acc[result.sourceType] = [];
    }
    acc[result.sourceType].push(result);
    return acc;
  }, {});

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-gray-900">
            🎯 Context Retrieved
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {results.length} item{results.length > 1 ? 's' : ''} from your
            materials will be included
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Dismiss preview"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {Object.entries(grouped).map(([sourceType, items]) => (
          <div key={sourceType} className="space-y-1">
            <div className="text-xs font-semibold text-gray-700 px-2 py-1 bg-white rounded opacity-75">
              {sourceType === 'flashcard' && '🎴 Flashcard'}
              {sourceType === 'quiz' && '❓ Quiz'}
              {sourceType === 'note' && '📝 Note'}
              {sourceType === 'video' && '🎥 Video'}
            </div>

            {items.map((item, idx) => {
              const level = getSimilarityLevel(item.similarity);
              const percentage = Math.round(item.similarity * 100);

              return (
                <div
                  key={`${item.sourceId}-${idx}`}
                  className="bg-white rounded p-2 text-xs border-l-2"
                  style={{ borderColor: level.color }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: level.color }}
                    >
                      {percentage}%
                    </span>
                    <span className="text-gray-500">{level.label}</span>
                  </div>
                  <p className="text-gray-700 line-clamp-2">
                    {item.text.substring(0, 100)}
                    {item.text.length > 100 ? '...' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600 border border-gray-200">
        💡 <strong>Tip:</strong> The LLM will use this context to provide
        answers grounded in your materials.
      </div>
    </div>
  );
}
