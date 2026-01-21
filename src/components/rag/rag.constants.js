// FILE: src/components/rag/rag.constants.js
// DESCRIPTION: RAG-related constants and configurations
// PURPOSE: Centralized configuration for RAG UI components

/**
 * Available RAG context sources
 * Maps source type to display name and description
 */
export const RAG_SOURCES = {
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
  video: {
    label: 'Videos',
    description: 'Search video transcripts',
    icon: '🎥',
    color: '#ec4899',
  },
};

/**
 * Slash commands for RAG
 */
export const RAG_SLASH_COMMANDS = [
  {
    command: '/context-flashcard',
    label: 'Flashcards',
    source: 'flashcard',
    shortcut: 'C+F',
  },
  {
    command: '/context-quiz',
    label: 'Quizzes',
    source: 'quiz',
    shortcut: 'C+Q',
  },
  {
    command: '/context-note',
    label: 'Notes',
    source: 'note',
    shortcut: 'C+N',
  },
  {
    command: '/context-all',
    label: 'All Sources',
    source: null,
    shortcut: 'C+A',
  },
];

/**
 * Default RAG configuration
 */
export const RAG_CONFIG_DEFAULTS = {
  topK: 5,
  threshold: 0.3,
  enabled: true,
};

/**
 * Similarity score thresholds for UI display
 */
export const SIMILARITY_LEVELS = {
  VERY_HIGH: { min: 0.8, label: 'Very Relevant', color: '#16a34a' },
  HIGH: { min: 0.6, label: 'Relevant', color: '#3b82f6' },
  MEDIUM: { min: 0.4, label: 'Somewhat Relevant', color: '#f59e0b' },
  LOW: { min: 0, label: 'Loosely Related', color: '#ef4444' },
};

/**
 * Get similarity level for a score
 * @param {number} similarity - Similarity score (0-1)
 * @returns {Object} Similarity level information
 */
export function getSimilarityLevel(similarity) {
  if (similarity >= SIMILARITY_LEVELS.VERY_HIGH.min)
    return SIMILARITY_LEVELS.VERY_HIGH;
  if (similarity >= SIMILARITY_LEVELS.HIGH.min) return SIMILARITY_LEVELS.HIGH;
  if (similarity >= SIMILARITY_LEVELS.MEDIUM.min)
    return SIMILARITY_LEVELS.MEDIUM;
  return SIMILARITY_LEVELS.LOW;
}

/**
 * Slash command detection pattern
 */
export const SLASH_COMMAND_PATTERN = /^\/(\w+)(-\w+)*/;

/**
 * Check if text starts with a slash command
 * @param {string} text - Text to check
 * @returns {boolean} True if text starts with /
 */
export function detectSlashCommand(text) {
  // Only show menu if text starts with / and is just the slash or followed by space
  const trimmed = text.trim();
  return trimmed.startsWith('/') && trimmed.length > 0;
}
