/**
 * FILE: src/hooks/useFlashcardsInit.js
 * DESCRIPTION: Hook to initialize flashcard system on app startup
 * 
 * Handles:
 * - Running migrations
 * - Seeding dev data
 * - Validating configuration
 */

import { useEffect, useState } from 'react';
import { runStorageMigration, seedDevelopmentData } from '@/lib/flashcardMigration';
import {
  FEATURE_FLASHCARDS_FSRS,
  MIGRATION_CONFIG,
  validateFSRSConfig,
} from '@/lib/config/flashcardsConfig';

/**
 * useFlashcardsInit
 * 
 * Initializes the flashcard system on component mount.
 * Should be called once at app root level.
 * 
 * @returns {Object} { initialized, error, isReady }
 */
export default function useFlashcardsInit() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!FEATURE_FLASHCARDS_FSRS) {
      setInitialized(true);
      return;
    }

    const initializeFlashcards = async () => {
      try {
        // Validate configuration
        const validation = validateFSRSConfig();
        if (!validation.valid) {
          console.warn('⚠️ Flashcard config validation warnings:', validation.errors);
        }

        // Run migrations
        if (MIGRATION_CONFIG.AUTO_MIGRATE) {
          const result = runStorageMigration();
          if (result.migrated) {
            console.log('✅ Flashcard storage migrated');
          }
        }

        // Seed development data if empty
        if (
          MIGRATION_CONFIG.SEED_DEV_DATA &&
          typeof window !== 'undefined'
        ) {
          const collections = JSON.parse(
            localStorage.getItem('flashcard_collections') || '[]'
          );
          if (collections.length === 0) {
            const result = seedDevelopmentData();
            if (result.success) {
              console.log('✅ Development data seeded');
            }
          }
        }

        setInitialized(true);
      } catch (err) {
        console.error('❌ Flashcard initialization error:', err);
        setError(err.message);
        setInitialized(true);
      }
    };

    // Run async initialization
    initializeFlashcards();
  }, []);

  return {
    initialized,
    error,
    isReady: initialized && !error,
  };
}
