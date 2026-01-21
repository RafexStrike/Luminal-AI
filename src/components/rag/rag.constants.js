// FILE: src/components/rag/rag.constants.js
// DESCRIPTION: RAG-related constants and configurations
// PURPOSE: Centralized configuration for RAG UI components

/**
 * Available RAG context sources
 * Maps source type to display name and description
 */
import { RAG_SOURCE_META, RAG_CONTENT_TYPES } from '@/lib/rag/content-types.js';

// Use the central RAG_SOURCE_META to allow easy extension (e.g., add 'video' later)
export const RAG_SOURCES = RAG_SOURCE_META;

/**
 * Slash commands for RAG - generated from RAG_CONTENT_TYPES
 */
export const RAG_SLASH_COMMANDS = [
  ...RAG_CONTENT_TYPES.map((t) => ({
    command: `/context-${t}`,
    label: RAG_SOURCE_META[t]?.label || t,
    source: t,
    shortcut: `C+${(t[0] || '').toUpperCase()}`,
  })),
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
