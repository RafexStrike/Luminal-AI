// Centralized RAG content types and metadata
export const RAG_CONTENT_TYPES = ['flashcard', 'quiz', 'note'];

export const RAG_SOURCE_META = {
  flashcard: {
    label: 'Flashcards',
    description: 'Search your flashcard decks',
    icon: '🎴',
    color: '#4f46e5',
  },
  quiz: {
    label: 'Quizzes',
    description: 'Find relevant quiz questions',
    icon: '❓',
    color: '#8b5cf6',
  },
  note: {
    label: 'Notes',
    description: 'Search your notes',
    icon: '📝',
    color: '#06b6d4',
  },
  // video intentionally omitted by default, added when needed
};