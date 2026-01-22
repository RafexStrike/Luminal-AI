/**
 * Component to display source type badges with icons
 * Shows which sources are being used for RAG context
 */
export function RagSourceBadges({ sources = [] }) {
  const sourceIcons = {
    flashcard: { icon: '🎴', label: 'Flashcards', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
    quiz: { icon: '❓', label: 'Quizzes', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
    note: { icon: '📝', label: 'Notes', color: 'bg-green-500/20 border-green-500/40 text-green-300' },
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => {
        const config = sourceIcons[source] || { icon: '📄', label: source, color: 'bg-gray-500/20 border-gray-500/40 text-gray-300' };
        return (
          <div
            key={source}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 ${config.color}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}
