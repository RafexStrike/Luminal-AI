/**
 * FILE: src/utils/flashcardIO.js
 * DESCRIPTION: API adapters for flashcard operations - wraps existing backend calls
 * 
 * This module provides a thin layer over existing API calls to ensure we reuse
 * the current generator and persistence mechanisms.
 */

import { migrateCard, getDailyStats } from '@/lib/helpers/flashcardHelpers';

/**
 * Generate flashcards from selected messages using the existing API
 * Reuses: /api/secondStage/flashcards (POST)
 * 
 * @param {string} chatId - chat ID
 * @param {Array<string>} messageIds - selected message IDs
 * @param {string} provider - LLM provider (default 'openai')
 * @param {string} apiKey - optional API key override
 * @returns {Promise<Array>} array of { q, a, difficulty, tags, ... }
 */
export async function generateFlashcardsFromMessages(
  chatId,
  messageIds,
  provider = 'openai',
  apiKey = null
) {
  const response = await fetch('/api/secondStage/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      messageIds,
      provider,
      apiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate flashcards');
  }

  const data = await response.json();
  return data.cards || [];
}

/**
 * Load existing flashcard sets for a chat
 * Reuses: /api/secondStage/flashcards (GET)
 * 
 * @param {string} chatId - chat ID
 * @returns {Promise<Array>} array of flashcard set documents
 */
export async function loadFlashcardSets(chatId) {
  const response = await fetch(`/api/secondStage/flashcards?chatId=${chatId}`);

  if (!response.ok) {
    throw new Error('Failed to load flashcard sets');
  }

  const data = await response.json();
  return data.sets || [];
}

/**
 * Create a new collection from AI-generated cards or manual entry
 * Stores locally in browser state/localStorage initially, persists to backend separately
 * 
 * @param {Object} collectionData - { name, source, cardIds, settings }
 * @returns {Object} collection with id, name, cardIds, etc.
 */
export function createCollection(collectionData) {
  const collection = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: collectionData.name || 'Untitled Collection',
    createdAt: new Date().toISOString(),
    source: collectionData.source || 'user', // 'ai' | 'user'
    cardIds: collectionData.cardIds || [],
    settings: {
      targetRetention: 0.9,
      maxReviewsPerDay: 50,
      ...collectionData.settings,
    },
  };

  return collection;
}

/**
 * Create a new card (manual entry)
 * 
 * @param {Object} cardData - { front, back, tags, collectionId }
 * @returns {Object} card with all FSRS fields initialized
 */
export function createCard(cardData) {
  const now = new Date().toISOString();
  
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    collectionId: cardData.collectionId || null,
    front: cardData.front || '',
    back: cardData.back || '',
    tags: cardData.tags || [],
    history: [],
    stability: 3, // default
    difficulty: 5, // default
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: now, // due immediately
  };
}

/**
 * Persist collection to localStorage (browser state)
 * For production, this would call a backend endpoint
 * 
 * @param {Object} collection - collection object
 */
export function persistCollection(collection) {
  try {
    const collections = JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
    const index = collections.findIndex(c => c.id === collection.id);
    
    if (index >= 0) {
      collections[index] = collection;
    } else {
      collections.push(collection);
    }
    
    localStorage.setItem('flashcard_collections', JSON.stringify(collections));
  } catch (err) {
    console.error('Error persisting collection:', err);
  }
}

/**
 * Load collections from localStorage
 * 
 * @returns {Array} array of collections
 */
export function loadCollections() {
  try {
    return JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
  } catch (err) {
    console.error('Error loading collections:', err);
    return [];
  }
}

/**
 * Persist card to localStorage
 * 
 * @param {Object} card - card object
 */
export function persistCard(card) {
  try {
    const cards = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
    cards[card.id] = card;
    localStorage.setItem('flashcard_cards', JSON.stringify(cards));
  } catch (err) {
    console.error('Error persisting card:', err);
  }
}

/**
 * Load cards from localStorage
 * 
 * @returns {Object} map of cardId -> card
 */
export function loadCards() {
  try {
    return JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
  } catch (err) {
    console.error('Error loading cards:', err);
    return {};
  }
}

/**
 * Load cards for a specific collection
 * Applies migration to ensure all fields present
 * 
 * @param {string} collectionId - collection ID
 * @returns {Array} array of cards
 */
export function loadCollectionCards(collectionId) {
  const cards = loadCards();
  const collectionCards = Object.values(cards)
    .filter(card => card.collectionId === collectionId)
    .map(card => migrateCard(card));
  
  return collectionCards;
}

/**
 * Delete a collection and its cards
 * 
 * @param {string} collectionId - collection ID
 */
export function deleteCollection(collectionId) {
  try {
    const collections = JSON.parse(localStorage.getItem('flashcard_collections') || '[]');
    const filtered = collections.filter(c => c.id !== collectionId);
    localStorage.setItem('flashcard_collections', JSON.stringify(filtered));
    
    // Also delete associated cards
    const cards = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
    Object.keys(cards).forEach(id => {
      if (cards[id].collectionId === collectionId) {
        delete cards[id];
      }
    });
    localStorage.setItem('flashcard_cards', JSON.stringify(cards));
  } catch (err) {
    console.error('Error deleting collection:', err);
  }
}

/**
 * Delete a specific card
 * 
 * @param {string} cardId - card ID
 */
export function deleteCard(cardId) {
  try {
    const cards = JSON.parse(localStorage.getItem('flashcard_cards') || '{}');
    delete cards[cardId];
    localStorage.setItem('flashcard_cards', JSON.stringify(cards));
  } catch (err) {
    console.error('Error deleting card:', err);
  }
}

/**
 * Compute collection statistics
 * 
 * @param {Array} cards - cards in collection
 * @returns {Object} stats including retention, due count, etc.
 */
export function getCollectionStats(cards) {
  return getDailyStats(cards);
}

/**
 * Batch import cards from AI generator result
 * Wraps raw AI output into proper card objects with default FSRS fields
 * 
 * @param {Array} aiCards - raw output from AI generator: [{ q, a, difficulty, tags }, ...]
 * @param {string} collectionId - collection these cards belong to
 * @returns {Array} migrated cards ready for storage
 */
export function importAIGeneratedCards(aiCards, collectionId) {
  return aiCards.map(aiCard => {
    const card = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      collectionId,
      front: aiCard.q || '',
      back: aiCard.a || '',
      tags: aiCard.tags || [],
      history: [],
      stability: 3,
      difficulty: aiCard.difficulty || 5,
      lapses: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
    };
    
    return migrateCard(card);
  });
}

/**
 * Export collection cards to CSV (Anki format)
 * 
 * @param {Array} cards - cards to export
 * @param {string} deckName - name for the deck
 * @returns {string} CSV data
 */
export function exportCollectionAsAnkiCSV(cards, deckName) {
  const { exportToAnkiCSV } = require('@/lib/helpers/flashcardHelpers');
  return exportToAnkiCSV(cards, deckName);
}

/**
 * Export collection cards to JSON
 * 
 * @param {Array} cards - cards to export
 * @returns {string} JSON data
 */
export function exportCollectionAsJSON(cards) {
  const { exportToJSON } = require('@/lib/helpers/flashcardHelpers');
  return exportToJSON(cards);
}
