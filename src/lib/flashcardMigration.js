/**
 * FILE: src/lib/flashcardMigration.js
 * DESCRIPTION: Migration helpers for backward compatibility
 * 
 * Handles:
 * - Adding FSRS fields to existing cards
 * - Upgrading old collection formats
 * - Seed data for development/testing
 */

import { migrateCard } from './helpers/flashcardHelpers';

/**
 * Migrate all existing cards to new FSRS format
 * Safe: only adds missing fields, never removes data
 * 
 * @param {Array} oldCards - cards in old format (may lack S, D, history)
 * @returns {Array} cards with all FSRS fields
 */
export function migrateCardsToFSRS(oldCards = []) {
  return oldCards.map(card => migrateCard(card));
}

/**
 * Upgrade collection document to new format
 * Adds settings if missing
 * 
 * @param {Object} oldCollection - collection in old format
 * @returns {Object} collection with settings
 */
export function upgradeCollection(oldCollection) {
  return {
    ...oldCollection,
    settings: oldCollection.settings || {
      targetRetention: 0.9,
      maxReviewsPerDay: 50,
    },
    source: oldCollection.source || 'unknown',
  };
}

/**
 * Generate seed data for development/testing
 * Creates a sample collection with 10 cards
 * 
 * @returns {Object} { collection, cards }
 */
export function generateSeedData() {
  const collectionId = `col_seed_${Date.now()}`;

  const collection = {
    id: collectionId,
    name: 'Sample Collection (Delete Me)',
    createdAt: new Date().toISOString(),
    source: 'seed',
    cardIds: [],
    settings: {
      targetRetention: 0.9,
      maxReviewsPerDay: 50,
    },
  };

  const sampleCards = [
    {
      front: 'What is the capital of France?',
      back: 'Paris',
      tags: ['geography', 'capitals'],
    },
    {
      front: 'What is the chemical symbol for gold?',
      back: 'Au',
      tags: ['chemistry', 'elements'],
    },
    {
      front: 'Who wrote Romeo and Juliet?',
      back: 'William Shakespeare',
      tags: ['literature', 'drama'],
    },
    {
      front: 'What is the largest planet in our solar system?',
      back: 'Jupiter',
      tags: ['astronomy', 'planets'],
    },
    {
      front: 'What is the speed of light in vacuum?',
      back: 'Approximately 299,792,458 meters per second (3×10^8 m/s)',
      tags: ['physics', 'constants'],
    },
    {
      front: 'What year did the Titanic sink?',
      back: '1912',
      tags: ['history', 'maritime'],
    },
    {
      front: 'What is the smallest prime number?',
      back: '2',
      tags: ['mathematics', 'numbers'],
    },
    {
      front: 'What is the molecular formula for table salt?',
      back: 'NaCl (Sodium Chloride)',
      tags: ['chemistry', 'compounds'],
    },
    {
      front: 'How many continents are there?',
      back: '7 (or 6 depending on classification)',
      tags: ['geography', 'continents'],
    },
    {
      front: 'What is the first element on the periodic table?',
      back: 'Hydrogen (H)',
      tags: ['chemistry', 'elements'],
    },
  ];

  const cards = sampleCards.map((cardData, idx) => {
    const card = {
      id: `card_seed_${collectionId}_${idx}`,
      collectionId,
      front: cardData.front,
      back: cardData.back,
      tags: cardData.tags,
      history: [],
      stability: 3 + Math.random() * 2, // 3-5 days
      difficulty: 4 + Math.random() * 2, // 4-6
      lapses: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
    };
    return card;
  });

  collection.cardIds = cards.map(c => c.id);

  return { collection, cards };
}

/**
 * Apply migration to localStorage
 * Safe: checks for existing data, migrates only if needed
 * 
 * @returns {Object} { collections, cards, migrated: boolean }
 */
export function runStorageMigration() {
  try {
    const collectionsData = localStorage.getItem('flashcard_collections');
    const cardsData = localStorage.getItem('flashcard_cards');

    let collections = collectionsData ? JSON.parse(collectionsData) : [];
    let cardsMap = cardsData ? JSON.parse(cardsData) : {};

    let migrated = false;

    // Upgrade collections
    const upgradedCollections = collections.map(col => {
      const upgraded = upgradeCollection(col);
      if (JSON.stringify(upgraded) !== JSON.stringify(col)) {
        migrated = true;
      }
      return upgraded;
    });

    // Migrate cards
    const migratedCards = {};
    Object.entries(cardsMap).forEach(([id, card]) => {
      const migrated_card = migrateCard(card);
      if (JSON.stringify(migrated_card) !== JSON.stringify(card)) {
        migrated = true;
      }
      migratedCards[id] = migrated_card;
    });

    // Save if any changes
    if (migrated) {
      localStorage.setItem('flashcard_collections', JSON.stringify(upgradedCollections));
      localStorage.setItem('flashcard_cards', JSON.stringify(migratedCards));
      console.log('✅ Flashcard storage migrated successfully');
    }

    return {
      collections: upgradedCollections,
      cards: migratedCards,
      migrated,
    };
  } catch (error) {
    console.error('❌ Flashcard migration error:', error);
    return { collections: [], cards: {}, migrated: false };
  }
}

/**
 * Reset all flashcard data (for testing)
 * WARNING: Destructive - only call with explicit user confirmation
 * 
 * @returns {Object} { success: boolean }
 */
export function resetAllFlashcardData() {
  try {
    localStorage.removeItem('flashcard_collections');
    localStorage.removeItem('flashcard_cards');
    console.log('✅ All flashcard data cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear flashcard data:', error);
    return { success: false };
  }
}

/**
 * Import sample data for development
 * 
 * @returns {Object} { collection, cards, success }
 */
export function seedDevelopmentData() {
  try {
    const { collection, cards } = generateSeedData();

    const collections = JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
    collections.push(collection);
    localStorage.setItem('flashcard_collections', JSON.stringify(collections));

    const cardsMap = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
    cards.forEach(card => {
      cardsMap[card.id] = card;
    });
    localStorage.setItem('flashcard_cards', JSON.stringify(cardsMap));

    console.log('✅ Sample data seeded:', collection.name);
    return { collection, cards, success: true };
  } catch (error) {
    console.error('❌ Failed to seed data:', error);
    return { collection: null, cards: [], success: false };
  }
}

/**
 * Export all flashcard data as JSON (for backup)
 * 
 * @returns {Object} { collections, cards }
 */
export function exportAllFlashcardData() {
  try {
    const collections = JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
    const cards = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
    return { collections, cards };
  } catch (error) {
    console.error('❌ Failed to export data:', error);
    return { collections: [], cards: {} };
  }
}

/**
 * Import flashcard data from JSON export
 * Merges with existing data
 * 
 * @param {Object} data - { collections, cards }
 * @returns {Object} { success, message }
 */
export function importFlashcardData(data) {
  try {
    const { collections: newCollections = [], cards: newCards = {} } = data;

    const existing = JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
    const existingCards = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');

    // Check for ID conflicts
    const existingIds = new Set(existing.map(c => c.id));
    const conflicting = newCollections.filter(c => existingIds.has(c.id));

    if (conflicting.length > 0) {
      return {
        success: false,
        message: `Import failed: ${conflicting.length} collection(s) already exist. Please rename or delete existing collections first.`,
      };
    }

    // Merge and save
    const merged = [...existing, ...newCollections];
    const mergedCards = { ...existingCards, ...newCards };

    localStorage.setItem('flashcard_collections', JSON.stringify(merged));
    localStorage.setItem('flashcard_cards', JSON.stringify(mergedCards));

    console.log(`✅ Imported ${newCollections.length} collection(s)`);
    return {
      success: true,
      message: `Successfully imported ${newCollections.length} collection(s) with ${Object.keys(newCards).length} card(s)`,
    };
  } catch (error) {
    console.error('❌ Import failed:', error);
    return { success: false, message: error.message };
  }
}
