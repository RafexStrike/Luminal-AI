/**
 * FILE: src/lib/config/flashcardsConfig.js
 * DESCRIPTION: Configuration and feature flags for the flashcard system
 */

/**
 * Feature flag - enable/disable FSRS flashcard system
 * Set via environment variable: NEXT_PUBLIC_FEATURE_FLASHCARDS_FSRS=true
 */
export const FEATURE_FLASHCARDS_FSRS = process.env.NEXT_PUBLIC_FEATURE_FLASHCARDS_FSRS === 'true' || true;

/**
 * FSRS Algorithm Configuration
 * These are tunable constants that affect scheduling behavior
 */
export const FSRS_CONFIG = {
  // Base gain factor for stability increase
  // Higher = larger stability jumps per review
  BASE_GAIN: 0.18,

  // Minimum interval between reviews (days)
  MIN_INTERVAL: 1,

  // Maximum interval between reviews (years)
  MAX_INTERVAL: 3650,

  // Default stability for new cards (days)
  DEFAULT_STABILITY: 3,

  // Default difficulty for new cards (1-10)
  DEFAULT_DIFFICULTY: 5,

  // Default target retention rate (0.5-0.99)
  // Probability user will recall the card at next review
  DEFAULT_TARGET_RETENTION: 0.9,

  // Maximum reviews per session
  MAX_REVIEWS_PER_SESSION: 50,
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  // Enable/disable keyboard shortcuts during review
  ENABLE_KEYBOARD_SHORTCUTS: true,

  // Show debug information in console
  DEBUG_MODE: process.env.NODE_ENV === 'development',

  // Enable/disable animations
  ENABLE_ANIMATIONS: true,

  // Toast notification duration (ms)
  TOAST_DURATION: 3000,
};

/**
 * Storage Configuration
 */
export const STORAGE_CONFIG = {
  // Storage backend: 'localStorage' | 'indexeddb' | 'backend'
  // Currently only localStorage is implemented
  BACKEND: 'localStorage',

  // Storage keys
  COLLECTIONS_KEY: 'flashcard_collections',
  CARDS_KEY: 'flashcard_cards',

  // Enable automatic backup
  AUTO_BACKUP_ENABLED: false,
  AUTO_BACKUP_INTERVAL_HOURS: 24,
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Endpoint for AI-generated flashcards (uses existing endpoint)
  GENERATOR_ENDPOINT: '/api/secondStage/flashcards',

  // Timeout for API calls (ms)
  API_TIMEOUT: 30000,

  // Retry attempts for failed requests
  RETRY_ATTEMPTS: 3,
};

/**
 * Education & Documentation
 */
export const DOCS_CONFIG = {
  // Enable interactive documentation
  ENABLE_DOCS: true,

  // Show "How it Works" on first use
  SHOW_ONBOARDING: true,

  // Example data for tutorials
  INCLUDE_EXAMPLES: true,
};

/**
 * Migration Configuration
 */
export const MIGRATION_CONFIG = {
  // Run migration on app start
  AUTO_MIGRATE: true,

  // Seed development data if empty
  SEED_DEV_DATA: process.env.NODE_ENV === 'development',
};

/**
 * Get effective target retention for a collection
 * Falls back to default if not specified
 * 
 * @param {number} collectionRetention - collection's targetRetention
 * @returns {number} target retention (0.5-0.99)
 */
export function getEffectiveTargetRetention(collectionRetention) {
  if (!collectionRetention) return FSRS_CONFIG.DEFAULT_TARGET_RETENTION;
  return Math.max(0.5, Math.min(0.99, collectionRetention));
}

/**
 * Get effective max reviews per day for a collection
 * Falls back to default if not specified
 * 
 * @param {number} collectionMax - collection's maxReviewsPerDay
 * @returns {number} max reviews (1-500)
 */
export function getEffectiveMaxReviewsPerDay(collectionMax) {
  if (!collectionMax) return FSRS_CONFIG.MAX_REVIEWS_PER_SESSION;
  return Math.max(1, Math.min(500, collectionMax));
}

/**
 * Validate FSRS configuration
 * Check for sensible values
 * 
 * @returns {Object} { valid, errors }
 */
export function validateFSRSConfig() {
  const errors = [];

  if (FSRS_CONFIG.BASE_GAIN <= 0 || FSRS_CONFIG.BASE_GAIN > 0.5) {
    errors.push('BASE_GAIN should be between 0 and 0.5');
  }

  if (FSRS_CONFIG.MIN_INTERVAL < 0.5 || FSRS_CONFIG.MIN_INTERVAL > 7) {
    errors.push('MIN_INTERVAL should be between 0.5 and 7 days');
  }

  if (FSRS_CONFIG.DEFAULT_STABILITY <= 0) {
    errors.push('DEFAULT_STABILITY must be positive');
  }

  if (FSRS_CONFIG.DEFAULT_DIFFICULTY < 1 || FSRS_CONFIG.DEFAULT_DIFFICULTY > 10) {
    errors.push('DEFAULT_DIFFICULTY should be between 1 and 10');
  }

  if (
    FSRS_CONFIG.DEFAULT_TARGET_RETENTION <= 0.5 ||
    FSRS_CONFIG.DEFAULT_TARGET_RETENTION >= 1
  ) {
    errors.push('DEFAULT_TARGET_RETENTION should be between 0.5 and 1.0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log configuration on initialization (debug mode)
 */
export function logConfiguration() {
  if (UI_CONFIG.DEBUG_MODE) {
    console.group('🎓 Flashcards Configuration');
    console.log('FSRS Config:', FSRS_CONFIG);
    console.log('Storage:', STORAGE_CONFIG.BACKEND);
    console.log('Feature Enabled:', FEATURE_FLASHCARDS_FSRS);
    const validation = validateFSRSConfig();
    if (!validation.valid) {
      console.warn('⚠️ Config validation errors:', validation.errors);
    }
    console.groupEnd();
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  logConfiguration();
}

export default {
  FEATURE_FLASHCARDS_FSRS,
  FSRS_CONFIG,
  UI_CONFIG,
  STORAGE_CONFIG,
  API_CONFIG,
  DOCS_CONFIG,
  MIGRATION_CONFIG,
  getEffectiveTargetRetention,
  getEffectiveMaxReviewsPerDay,
  validateFSRSConfig,
};
