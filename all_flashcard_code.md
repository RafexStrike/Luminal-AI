# Flashcard Codebase

## File: src/hooks/useFlashcardsInit.js

```javascript
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

```

## File: src/utils/flashcardIO.js

```javascript
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

```

## File: src/components/flashcards/CardEditorModal.jsx

```jsx
/**
 * FILE: src/components/flashcards/CardEditorModal.jsx
 * DESCRIPTION: Create/edit card UI with front/back text areas and tags
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function CardEditorModal({
  isOpen = false,
  card = null,
  onSave,
  onCancel,
}) {
  const [front, setFront] = useState(card?.front || '');
  const [back, setBack] = useState(card?.back || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(card?.tags || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      alert('Please fill in both front and back of the card');
      return;
    }

    setIsLoading(true);
    try {
      await onSave?.({
        ...card,
        front: front.trim(),
        back: back.trim(),
        tags,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card?.id ? 'Edit Card' : 'Create New Card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Front */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Front (Question)
            </label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What is the capital of France?"
              className="min-h-24"
            />
          </div>

          {/* Back */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Back (Answer)
            </label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paris"
              className="min-h-24"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag (press Enter)"
                className="flex-1"
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:opacity-75"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !front.trim() || !back.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

## File: src/components/flashcards/README.md

/**
 * FSRS-LITE FLASHCARD SYSTEM - IMPLEMENTATION GUIDE
 * 
 * FILE: src/components/flashcards/README.md
 * 
 * ## Overview
 * 
 * This directory contains a complete FSRS-lite (Free Spaced Repetition Scheduler) 
 * implementation for interactive flashcard learning. It integrates with the existing 
 * AI flashcard generator and extends it with:
 * 
 * - Collection-based organization (decks)
 * - User-created and manual cards
 * - FSRS-lite scheduling algorithm
 * - Daily review queue with rating interface
 * - Dashboard with analytics
 * - Comprehensive documentation and "how it works" guide
 * - Export to Anki and JSON formats
 * 
 * ## Architecture
 * 
 * ### Component Structure
 * 
 * ```
 * components/flashcards/
 * ├── FlashcardsLayout.jsx          # Main orchestrator
 * ├── FlashcardsIntegration.jsx     # AI generation integration
 * ├── CollectionList.jsx            # Sidebar collection selector
 * ├── CollectionHeader.jsx          # Collection metadata & actions
 * ├── ReviewQueue.jsx               # Daily review session manager
 * ├── ReviewCard.jsx                # Single card flip interface
 * ├── CardEditorModal.jsx           # Create/edit card UI
 * ├── CollectionSettings.jsx        # Collection preferences
 * ├── FlashcardDashboard.jsx        # Analytics & stats
 * ├── FlashcardsDocPopup.jsx        # Interactive documentation
 * └── README.md                     # This file
 * ```
 * 
 * ### Data Flow
 * 
 * ```
 * User selects messages in chat
 *          ↓
 *   "Generate Flashcards" button
 *          ↓
 * FlashcardsIntegration calls existing /api/secondStage/flashcards
 *          ↓
 * AI returns raw cards: [{ q, a, difficulty, tags }, ...]
 *          ↓
 * importAIGeneratedCards() wraps them with FSRS fields
 *          ↓
 * Create Collection and persist to localStorage
 *          ↓
 * FlashcardsLayout displays collection with review UI
 *          ↓
 * User clicks "Start Review" → ReviewQueue shows due cards
 *          ↓
 * User rates each card (Again/Hard/Good/Easy)
 *          ↓
 * applyReviewUpdate() updates S, D, nextReviewAt
 *          ↓
 * persistCard() saves to localStorage
 *          ↓
 * Next review scheduled via nextReviewAt timestamp
 * ```
 * 
 * ## Key Files
 * 
 * ### Helper Functions: lib/helpers/flashcardHelpers.js
 * 
 * Core FSRS-lite algorithm implementation:
 * 
 * - `estimateR(daysSince, stability)` - Recall probability decay
 * - `applyReviewUpdate(card, quality, now, targetRetention)` - Update rules
 * - `getDueCards(cards, today)` - Filter for review
 * - `estimateCollectionRetention(cards)` - Overall stats
 * - `migrateCard(card)` - Add FSRS fields to old cards
 * - `simulateExample()` - Educational walkthrough
 * - `exportToAnkiCSV(cards)` - Export functionality
 * 
 * ### IO Layer: utils/flashcardIO.js
 * 
 * Adapters for API calls and localStorage:
 * 
 * - `generateFlashcardsFromMessages()` - Calls existing generator
 * - `loadFlashcardSets()` - Retrieves from backend
 * - `createCollection()`, `createCard()` - Factory functions
 * - `persistCollection()`, `persistCard()` - localStorage save
 * - `loadCollections()`, `loadCards()` - localStorage load
 * - `importAIGeneratedCards()` - Wrap AI output with FSRS fields
 * 
 * ## FSRS-Lite Algorithm
 * 
 * ### Key Concepts
 * 
 * **Stability (S):** Memory trace strength in days
 * - Higher S → longer intervals between reviews
 * - Starts at 3 days (default)
 * - Increases with successful recalls
 * - Decreases when user forgets
 * 
 * **Difficulty (D):** Material difficulty (1-10 scale)
 * - Higher D → more frequent reviews
 * - Starts at 5 (medium)
 * - Increases when user struggles
 * - Decreases when user recalls easily
 * 
 * **Retrievability (R):** Estimated recall probability (0-1)
 * - R(t) = e^(-t / S)
 * - Decays exponentially from 100% immediately after review
 * - At scheduled review, R ≈ targetRetention (default 90%)
 * 
 * ### Review Rules
 * 
 * When user rates a card:
 * 
 * **Again (0):** User forgot
 * ```
 * S_new = max(0.5, S * 0.5)  // Half, with 0.5 day floor
 * D_new = D + 0.5             // Increase difficulty
 * lapses++                     // Track failures
 * ```
 * 
 * **Hard (3):** Recalled with difficulty
 * ```
 * gain = 0.18 * (1/3) * (1 + (1 - R))
 * S_new = S * (1 + gain)
 * D_new = clamp(D - 0.05 * (3-3), 1, 10)  // D unchanged
 * ```
 * 
 * **Good (4):** Standard successful recall
 * ```
 * gain = 0.18 * (2/3) * (1 + (1 - R))
 * S_new = S * (1 + gain)
 * D_new = clamp(D - 0.05 * (4-3), 1, 10)  // D decreases slightly
 * ```
 * 
 * **Easy (5):** Recalled effortlessly
 * ```
 * gain = 0.18 * (3/3) * (1 + (1 - R))
 * S_new = S * (1 + gain)
 * D_new = clamp(D - 0.05 * (5-3), 1, 10)  // D decreases
 * ```
 * 
 * ### Next Review Calculation
 * 
 * After updating S, solve: R(t_next) = targetRetention
 * 
 * ```
 * e^(-t_next / S) = targetRetention
 * t_next = -S * ln(targetRetention)
 * 
 * Clamp to [1 day, 3650 days]
 * nextReviewAt = now + t_next
 * ```
 * 
 * ## Data Model
 * 
 * ### Card
 * 
 * ```javascript
 * {
 *   id: "card_...",           // Unique identifier
 *   collectionId: "col_...",  // Parent collection
 *   front: "Question?",       // Question side
 *   back: "Answer",           // Answer side
 *   tags: ["physics"],        // Categorization
 *   history: [                // Review history
 *     { ts: "2026-01-07...", quality: 4, interval: 6 },
 *     ...
 *   ],
 *   stability: 6.2,           // S (days)
 *   difficulty: 3.1,          // D (1-10)
 *   lapses: 0,                // Failure count
 *   lastReviewedAt: "...",    // ISO timestamp
 *   nextReviewAt: "...",      // Next review due
 * }
 * ```
 * 
 * ### Collection
 * 
 * ```javascript
 * {
 *   id: "col_...",
 *   name: "Biology Ch. 3",
 *   createdAt: "...",
 *   source: "ai" | "user",
 *   cardIds: ["card_...", ...],
 *   settings: {
 *     targetRetention: 0.9,     // Default 90%
 *     maxReviewsPerDay: 50,
 *   }
 * }
 * ```
 * 
 * ## Usage Examples
 * 
 * ### Generating AI Flashcards
 * 
 * ```jsx
 * import FlashcardsIntegration from '@/components/flashcards/FlashcardsIntegration';
 * 
 * export default function ChatTab() {
 *   return (
 *     <FlashcardsIntegration
 *       chatId={currentChatId}
 *       selectedMessageIds={selectedMessages}
 *       onGenerateComplete={() => console.log('Done!')}
 *     />
 *   );
 * }
 * ```
 * 
 * ### Using Main Layout Directly
 * 
 * ```jsx
 * import FlashcardsLayout from '@/components/flashcards/FlashcardsLayout';
 * 
 * export default function FlashcardsPage() {
 *   return <FlashcardsLayout chatId={null} />;
 * }
 * ```
 * 
 * ### Manual Card Review
 * 
 * ```jsx
 * import ReviewQueue from '@/components/flashcards/ReviewQueue';
 * import { loadCollectionCards } from '@/utils/flashcardIO';
 * 
 * const cards = loadCollectionCards(collectionId);
 * 
 * <ReviewQueue
 *   cards={cards}
 *   collectionId={collectionId}
 *   targetRetention={0.9}
 *   onQueueEmpty={() => console.log('Session complete')}
 * />
 * ```
 * 
 * ## Feature Flags & Configuration
 * 
 * The system respects a feature flag `FEATURE_FLASHCARDS_FSRS`:
 * 
 * ```javascript
 * // Enable/disable the entire FSRS system
 * const FEATURE_FLASHCARDS_FSRS = true;  // Set in config or .env
 * ```
 * 
 * Collection settings (configurable per collection):
 * 
 * - `targetRetention` (0.5 - 0.99): Lower = more reviews, higher retention
 * - `maxReviewsPerDay` (1 - 500): Cap on daily reviews
 * 
 * ## Migration & Backward Compatibility
 * 
 * ### For Existing Cards
 * 
 * When loading cards that lack FSRS fields:
 * 
 * ```javascript
 * migrateCard(oldCard)
 * // Returns card with:
 * // - stability: 3 (default)
 * // - difficulty: 5 (default)
 * // - history: [] (empty)
 * // - lapses: 0
 * // - nextReviewAt: now (due immediately)
 * ```
 * 
 * Estimation from existing history:
 * 
 * ```javascript
 * // If card has review history, estimate S from last interval
 * const estimatedInterval = (hist[1].ts - hist[0].ts) / (1000 * 60 * 60 * 24);
 * stability = Math.max(0.5, estimatedInterval);
 * ```
 * 
 * ## Persistence Strategy
 * 
 * Currently uses browser localStorage for development:
 * 
 * ```javascript
 * localStorage.setItem('flashcard_collections', JSON.stringify(collections));
 * localStorage.setItem('flashcard_cards', JSON.stringify(cardMap));
 * ```
 * 
 * For production, implement backend endpoints:
 * 
 * ```javascript
 * POST /api/secondStage/collections - Create
 * GET /api/secondStage/collections - List
 * PUT /api/secondStage/collections/:id - Update
 * DELETE /api/secondStage/collections/:id - Delete
 * 
 * POST /api/secondStage/cards - Create
 * PUT /api/secondStage/cards/:id - Update (called after each review)
 * DELETE /api/secondStage/cards/:id - Delete
 * GET /api/secondStage/cards?collectionId=... - List
 * ```
 * 
 * ## Keyboard Shortcuts
 * 
 * During review:
 * - **Space** - Flip card
 * - **1** - Again
 * - **2** - Hard
 * - **3** - Good
 * - **4** - Easy
 * 
 * ## Testing
 * 
 * ### Manual Testing Steps
 * 
 * 1. **Create Collection:**
 *    - Click "New Collection"
 *    - Enter name
 *    - Verify collection appears in sidebar
 * 
 * 2. **Add Cards:**
 *    - Click "Add Card" in collection header
 *    - Fill front/back with test data
 *    - Add tags
 *    - Save
 *    - Verify card appears in grid
 * 
 * 3. **Start Review:**
 *    - Click "Review Due Cards" button
 *    - Flip card with space
 *    - Rate 1-4
 *    - Verify next card loads
 *    - Check session stats update
 * 
 * 4. **Check Dashboard:**
 *    - Verify collection stats displayed
 *    - Check retention percentage
 *    - Verify upcoming schedule shows intervals
 * 
 * 5. **Export:**
 *    - Click Export in collection menu
 *    - Choose JSON or Anki format
 *    - Verify download
 * 
 * ### Unit Test Examples
 * 
 * ```javascript
 * import { estimateR, applyReviewUpdate } from '@/lib/helpers/flashcardHelpers';
 * 
 * test('estimateR(1, 10) ≈ 0.9', () => {
 *   const r = estimateR(1, 10);
 *   expect(r).toBeCloseTo(Math.exp(-0.1), 4);
 * });
 * 
 * test('Again reduces stability by half', () => {
 *   const card = { stability: 4, difficulty: 5, lapses: 0, history: [] };
 *   const updated = applyReviewUpdate(card, 0, new Date());
 *   expect(updated.stability).toBe(2);
 *   expect(updated.lapses).toBe(1);
 * });
 * 
 * test('Good increases stability', () => {
 *   const card = { stability: 3, difficulty: 5, lapses: 0, history: [] };
 *   const updated = applyReviewUpdate(card, 4, new Date());
 *   expect(updated.stability).toBeGreaterThan(3);
 * });
 * ```
 * 
 * ## Future Improvements
 * 
 * ### Upgrade to Full FSRS v4
 * 
 * The current implementation is intentionally simplified. To upgrade to full FSRS:
 * 
 * 1. Port FSRS Python optimizer to Node.js
 * 2. Implement parameters: `w` array (17+ coefficients)
 * 3. Add SM-2 fallback for cold-start
 * 4. Implement parameter learning from review logs
 * 5. Swap scheduler: `applyReviewUpdate()` → `fsrsv4.nextReview()`
 * 
 * The `flashcardHelpers` module is designed to be pluggable:
 * 
 * ```javascript
 * // Current
 * import { applyReviewUpdate } from '@/lib/helpers/flashcardHelpers';
 * 
 * // Future
 * import { applyReviewUpdate as applyReviewUpdateFSRS4 } from '@/lib/fsrs-v4';
 * const applyReviewUpdate = process.env.FSRS_VERSION === '4' ? applyReviewUpdateFSRS4 : fallback;
 * ```
 * 
 * ### Telemetry & Analytics
 * 
 * Add logging for model fitting:
 * 
 * ```javascript
 * // log review outcomes for later analysis
 * telemetry.logReview({
 *   cardId,
 *   S_before, D_before, R_at_review,
 *   quality,
 *   S_after, D_after,
 *   daysUntilNextReview,
 * });
 * ```
 * 
 * ### Cloud Sync
 * 
 * Future: sync collections and cards across devices via backend.
 * 
 * ## Troubleshooting
 * 
 * ### Cards not saving?
 * - Check localStorage quota (usually 5-10MB)
 * - Clear browser cache and reload
 * - Check browser console for errors
 * 
 * ### Review intervals too short/long?
 * - Adjust `targetRetention` in collection settings
 * - Lower values (0.7-0.8) = shorter intervals
 * - Higher values (0.95) = longer intervals
 * 
 * ### Forgot a card?
 * - It will reappear in "Priority Study" dashboard
 * - Stability reduced by half, will review sooner
 * 
 * ## References
 * 
 * - FSRS GitHub: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
 * - Original FSRS Paper: https://arxiv.org/abs/2209.12731
 * - Spaced Repetition Theory: https://www.gwern.net/Spaced-repetition
 * - Anki Documentation: https://docs.ankiweb.net/
 */

export const README = `See comments in this file for complete documentation`;


## File: src/components/flashcards/FlashcardsIntegration.jsx

```jsx
/**
 * FILE: src/components/flashcards/FlashcardsIntegration.jsx
 * DESCRIPTION: Integration layer that wraps AI-generated flashcards into the FSRS collection system
 * 
 * When user generates flashcards from chat:
 *   1. Call existing AI generator API
 *   2. Create a new collection automatically
 *   3. Import generated cards with FSRS fields
 *   4. Show collection view
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generateFlashcardsFromMessages, createCollection, importAIGeneratedCards, persistCollection, persistCard, loadCollections } from '@/utils/flashcardIO';
import FlashcardsLayout from './FlashcardsLayout';

export default function FlashcardsIntegration({
  chatId = null,
  selectedMessageIds = [],
  onGenerateStart = () => {},
  onGenerateComplete = () => {},
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(null);

  // Load collections on mount
  useEffect(() => {
    const loaded = loadCollections();
    setCollections(loaded);
  }, []);

  const handleGenerateFlashcards = async () => {
    if (!chatId || selectedMessageIds.length === 0) {
      setError('Please select messages to generate flashcards from');
      return;
    }

    setIsGenerating(true);
    setError(null);
    onGenerateStart?.();

    try {
      // Call existing AI generator
      const generatedCards = await generateFlashcardsFromMessages(
        chatId,
        selectedMessageIds,
        'openai'
      );

      if (!generatedCards || generatedCards.length === 0) {
        setError('No flashcards were generated. Please try again.');
        return;
      }

      // Create a new collection
      const timestamp = new Date().toLocaleString();
      const collection = createCollection({
        name: `Generated ${timestamp}`,
        source: 'ai',
        cardIds: [],
        settings: {
          targetRetention: 0.9,
          maxReviewsPerDay: 50,
        },
      });

      // Import cards into the collection
      const importedCards = importAIGeneratedCards(generatedCards, collection.id);

      // Update collection with card IDs
      collection.cardIds = importedCards.map(c => c.id);

      // Persist collection and cards
      persistCollection(collection);
      importedCards.forEach(card => persistCard(card));

      // Update local state
      setCollections(prev => [...prev, collection]);

      // Show the layout
      setShowLayout(true);
      onGenerateComplete?.();
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showLayout) {
    return <FlashcardsLayout chatId={chatId} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Generate Flashcards</h2>
        <p className="text-gray-400">
          {selectedMessageIds.length > 0
            ? `Ready to generate flashcards from ${selectedMessageIds.length} message${selectedMessageIds.length !== 1 ? 's' : ''}`
            : 'Select messages from the chat above to generate flashcards'}
        </p>
      </div>

      {error && (
        <div className="max-w-md p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleGenerateFlashcards}
        disabled={isGenerating || selectedMessageIds.length === 0}
        className="bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95"
      >
        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </Button>

      {isGenerating && (
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
          <p className="text-gray-400 text-sm mt-2">Creating your flashcard collection...</p>
        </div>
      )}

      <div className="max-w-md text-xs text-gray-500 text-center mt-4">
        💡 Tip: You can create collections manually, add cards individually, and review using the FSRS scheduler.
      </div>
    </div>
  );
}

```

## File: src/components/flashcards/CollectionSettings.jsx

```jsx
/**
 * FILE: src/components/flashcards/CollectionSettings.jsx
 * DESCRIPTION: Collection settings dialog (target retention, max reviews per day)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CollectionSettings({
  isOpen = false,
  collection = null,
  onSave,
  onCancel,
}) {
  const [targetRetention, setTargetRetention] = useState(
    collection?.settings?.targetRetention * 100 || 90
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    collection?.settings?.maxReviewsPerDay || 50
  );

  const handleSave = async () => {
    await onSave?.({
      targetRetention: targetRetention / 100,
      maxReviewsPerDay: parseInt(maxReviewsPerDay, 10),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Retention */}
          <div>
            <Label htmlFor="retention">Target Retention Rate (%)</Label>
            <p className="text-xs text-gray-400 mb-2">
              Desired recall probability. Higher = longer intervals.
            </p>
            <div className="flex gap-2">
              <Input
                id="retention"
                type="range"
                min="50"
                max="99"
                value={targetRetention}
                onChange={(e) => setTargetRetention(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-gray-300 font-semibold min-w-12">
                {targetRetention}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {targetRetention <= 70
                ? '⚠️ Low retention - very frequent reviews'
                : targetRetention <= 80
                ? '⚡ Moderate - frequent reviews'
                : targetRetention <= 90
                ? '✅ Balanced (recommended)'
                : '🎯 High - less frequent but harder'}
            </p>
          </div>

          {/* Max Reviews Per Day */}
          <div>
            <Label htmlFor="max-reviews">Max Reviews Per Day</Label>
            <p className="text-xs text-gray-400 mb-2">
              Stop showing new reviews after this limit.
            </p>
            <Input
              id="max-reviews"
              type="number"
              min="1"
              max="500"
              value={maxReviewsPerDay}
              onChange={(e) => setMaxReviewsPerDay(e.target.value)}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <p className="text-sm text-blue-200">
              💡 <strong>Tip:</strong> Use 90% retention for balanced learning. Lower values
              require more daily reviews but improve retention.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

```

## File: src/components/flashcards/ReviewQueue.jsx

```jsx
/**
 * FILE: src/components/flashcards/ReviewQueue.jsx
 * DESCRIPTION: Daily review queue - shows cards due for review with rating flow
 *              Includes session progress, completion summary, and parent state sync.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReviewCard from './ReviewCard';
import { applyReviewUpdate, getDueCards, estimateCollectionRetention } from '@/lib/helpers/flashcardHelpers';
import { persistCard } from '@/utils/flashcardIO';

export default function ReviewQueue({
  cards = [],
  collectionId = null,
  targetRetention = 0.9,
  onQueueEmpty = () => { },
  onCardReviewed = null, // NEW: called after each card update with the updated card object
}) {
  const [queue, setQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [reviewedCards, setReviewedCards] = useState([]); // track all reviewed cards this session
  const [showSummary, setShowSummary] = useState(false);

  // Initialize queue on mount or when cards change
  useEffect(() => {
    const dueCards = getDueCards(cards);
    setQueue(dueCards);
    setCurrentCardIndex(0);
    setCompletedCount(0);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setReviewedCards([]);
    setShowSummary(false);
  }, [cards, collectionId]);

  const handleRate = async (quality) => {
    if (queue.length === 0) return;

    setIsLoading(true);
    try {
      const card = queue[currentCardIndex];
      const updatedCard = applyReviewUpdate(card, quality, new Date(), targetRetention);

      // Persist updated card to localStorage
      persistCard(updatedCard);

      // Notify parent so it can update its in-memory allCards state
      onCardReviewed?.(updatedCard);

      // Track reviewed card in session
      setReviewedCards(prev => [...prev, { card: updatedCard, quality }]);

      // Update session stats
      const qualityNames = { 0: 'again', 3: 'hard', 4: 'good', 5: 'easy' };
      const qualityName = qualityNames[quality] || 'again';
      setSessionStats(prev => ({
        ...prev,
        [qualityName]: prev[qualityName] + 1,
      }));

      // Move to next card
      const nextIndex = currentCardIndex + 1;
      setCompletedCount(nextIndex);

      if (nextIndex >= queue.length) {
        // Queue complete — show summary
        setShowSummary(true);
      } else {
        setCurrentCardIndex(nextIndex);
      }
    } catch (error) {
      console.error('Error rating card:', error);
      alert('Failed to save review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Session Complete Summary ─────────────────────────────────────────────
  if (showSummary) {
    const totalReviewed = reviewedCards.length;
    const correctCount = reviewedCards.filter(r => r.quality >= 3).length;
    const retentionPct = totalReviewed > 0
      ? Math.round((correctCount / totalReviewed) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
        {/* Trophy icon */}
        <div className="text-7xl animate-bounce">🎉</div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-100">Session Complete!</h2>
          <p className="text-gray-400">Great work — here's how you did</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          <Card className="bg-gray-800 border-gray-700 p-4 text-center">
            <div className="text-3xl font-bold text-white">{totalReviewed}</div>
            <div className="text-xs text-gray-400 mt-1">Cards Reviewed</div>
          </Card>
          <Card className="bg-green-900/30 border-green-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-300">{retentionPct}%</div>
            <div className="text-xs text-gray-400 mt-1">Correct Rate</div>
          </Card>
          <Card className="bg-purple-900/30 border-purple-700 p-4 text-center">
            <div className="text-3xl font-bold text-purple-300">{sessionStats.easy + sessionStats.good}</div>
            <div className="text-xs text-gray-400 mt-1">Good / Easy</div>
          </Card>
          <Card className="bg-red-900/30 border-red-700 p-4 text-center">
            <div className="text-3xl font-bold text-red-300">{sessionStats.again}</div>
            <div className="text-xs text-gray-400 mt-1">Again</div>
          </Card>
        </div>

        {/* Rating breakdown */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-400">Again: <span className="text-gray-200 font-semibold">{sessionStats.again}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-400">Hard: <span className="text-gray-200 font-semibold">{sessionStats.hard}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-400">Good: <span className="text-gray-200 font-semibold">{sessionStats.good}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-400">Easy: <span className="text-gray-200 font-semibold">{sessionStats.easy}</span></span>
          </div>
        </div>

        <Button
          onClick={() => onQueueEmpty?.()}
          className="bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95 px-8 py-3 text-base"
        >
          Back to Collection →
        </Button>
      </div>
    );
  }

  // ── Empty Queue ──────────────────────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="text-6xl">✨</div>
        <h2 className="text-2xl font-bold text-gray-100">No reviews due!</h2>
        <p className="text-gray-400 max-w-md">
          All caught up. Come back later when more cards are due.
        </p>
        <Button onClick={() => onQueueEmpty?.()} variant="outline">
          Back to Collection
        </Button>
      </div>
    );
  }

  // ── Active Review ────────────────────────────────────────────────────────
  const currentCard = queue[currentCardIndex];
  const progress = (completedCount / queue.length) * 100;

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Today's Review</h2>
          <p className="text-sm text-gray-400">
            Card <span className="font-semibold text-gray-200">{completedCount + 1}</span> of{' '}
            <span className="font-semibold text-gray-200">{queue.length}</span>
          </p>
        </div>

        {/* Session stats */}
        <div className="flex gap-4 text-sm">
          {[
            { label: 'Easy', value: sessionStats.easy, color: 'text-blue-400' },
            { label: 'Good', value: sessionStats.good, color: 'text-green-400' },
            { label: 'Hard', value: sessionStats.hard, color: 'text-orange-400' },
            { label: 'Again', value: sessionStats.again, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`font-semibold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-violet-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current card */}
      <div className="flex-1 flex items-center justify-center">
        <ReviewCard
          card={currentCard}
          cardIndex={completedCount}
          totalCards={queue.length}
          onRate={handleRate}
          isLoading={isLoading}
          targetRetention={targetRetention}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => {
            if (currentCardIndex > 0) {
              setCurrentCardIndex(currentCardIndex - 1);
              setCompletedCount(completedCount - 1);
            }
          }}
          disabled={currentCardIndex === 0}
          variant="outline"
        >
          ← Back
        </Button>

        <Button
          onClick={() => {
            if (currentCardIndex < queue.length - 1) {
              setCurrentCardIndex(currentCardIndex + 1);
              setCompletedCount(completedCount + 1);
            }
          }}
          disabled={currentCardIndex >= queue.length - 1}
          variant="outline"
        >
          Skip →
        </Button>

        <Button onClick={() => onQueueEmpty?.()} variant="outline">
          Finish Session
        </Button>
      </div>
    </div>
  );
}

```

## File: src/components/flashcards/FlashcardDashboard.jsx

```jsx
/**
 * FILE: src/components/flashcards/FlashcardDashboard.jsx
 * DESCRIPTION: Learning dashboard — stats, upcoming schedule, and weak concepts
 */

'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  estimateCollectionRetention,
  getLowStabilityCards,
  getDailyStats,
  getUpcomingCards,
  formatInterval,
  estimateR,
} from '@/lib/helpers/flashcardHelpers';

// Day-of-week labels
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Group upcoming cards by calendar day for the next 7 days
 */
function groupCardsByDay(cards, today = new Date()) {
  const groups = [];
  for (let i = 1; i <= 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayCards = cards.filter(card => {
      if (!card.nextReviewAt) return false;
      const nr = new Date(card.nextReviewAt);
      return nr >= day && nr < nextDay;
    });

    groups.push({
      label: DAY_LABELS[day.getDay()],
      date: day,
      count: dayCards.length,
      isToday: false,
    });
  }
  return groups;
}

export default function FlashcardDashboard({ collections = [], allCards = {} }) {
  const today = new Date();
  const cardsArray = Object.values(allCards);

  const stats = useMemo(() => {
    const totalCards = cardsArray.length;
    const avgRetention = estimateCollectionRetention(cardsArray);
    const dailyStats = getDailyStats(cardsArray);
    const upcomingCards = getUpcomingCards(cardsArray, 7);
    const lowStabilityCards = getLowStabilityCards(cardsArray, 6);
    const upcomingByDay = groupCardsByDay(cardsArray);
    const maxDayCount = Math.max(...upcomingByDay.map(d => d.count), 1);

    return {
      totalCards,
      avgRetention,
      dueTodayCount: dailyStats.dueTodayCount,
      reviewedTodayCount: dailyStats.reviewedTodayCount,
      lowStabilityCards,
      upcomingByDay,
      maxDayCount,
      upcomingCards,
    };
  }, [allCards, collections]);

  const estimatedMinutes = Math.max(1, Math.ceil(stats.dueTodayCount * 1.5));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-100">Learning Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cards */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-5">
          <div className="text-4xl font-bold text-gray-100">{stats.totalCards}</div>
          <div className="text-sm text-gray-400 mt-1">Total Cards</div>
          <div className="text-xs text-gray-600 mt-1">across {collections.length} collection{collections.length !== 1 ? 's' : ''}</div>
        </Card>

        {/* Retention */}
        <Card className="bg-gradient-to-br from-green-900/25 to-emerald-900/20 border-green-700/50 p-5">
          <div className="text-4xl font-bold text-green-300">
            {(stats.avgRetention * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Avg Retention</div>
          <Progress value={stats.avgRetention * 100} className="mt-3 h-1.5" />
        </Card>

        {/* Due Today */}
        <Card className="bg-gradient-to-br from-orange-900/25 to-red-900/20 border-orange-700/50 p-5">
          <div className="text-4xl font-bold text-orange-300">{stats.dueTodayCount}</div>
          <div className="text-sm text-gray-400 mt-1">Due Now</div>
          <div className="text-xs text-gray-500 mt-1">~{estimatedMinutes} min</div>
        </Card>

        {/* Reviewed Today */}
        <Card className="bg-gradient-to-br from-purple-900/25 to-violet-900/20 border-purple-700/50 p-5">
          <div className="text-4xl font-bold text-purple-300">{stats.reviewedTodayCount}</div>
          <div className="text-sm text-gray-400 mt-1">Reviewed Today</div>
          {stats.reviewedTodayCount > 0 && (
            <div className="text-xs text-purple-400/70 mt-1">✓ Great work!</div>
          )}
        </Card>
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Reviews Calendar */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-1">📅 Upcoming Reviews</h3>
          <p className="text-xs text-gray-500 mb-5">Next 7 days — scheduled workload</p>

          {stats.upcomingByDay.every(d => d.count === 0) ? (
            <div className="text-center text-gray-600 py-8 text-sm">
              No cards scheduled yet. Complete a review session first!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingByDay.map((day, idx) => {
                const barPct = stats.maxDayCount > 0
                  ? (day.count / stats.maxDayCount) * 100
                  : 0;
                const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={idx} className="flex items-center gap-3">
                    {/* Day label */}
                    <div className="w-10 text-right text-xs font-semibold text-gray-400 flex-shrink-0">
                      {day.label}
                    </div>

                    {/* Bar */}
                    <div className="flex-1 bg-gray-800 rounded-full h-5 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(barPct, day.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>

                    {/* Count */}
                    <div className="w-16 text-xs text-gray-400 flex-shrink-0">
                      {day.count > 0 ? (
                        <span className="text-gray-200 font-semibold">{day.count}</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}{' '}
                      {day.count > 0 && <span className="text-gray-500">cards</span>}
                    </div>

                    {/* Date */}
                    <div className="w-14 text-xs text-gray-600 flex-shrink-0 hidden md:block">
                      {dateStr}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Weak Concepts */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-1">🔥 Weak Concepts</h3>
          <p className="text-xs text-gray-500 mb-5">Lowest memory stability — focus here</p>

          {stats.lowStabilityCards.length === 0 ? (
            <div className="text-center text-gray-600 py-8 text-sm">
              No cards yet. Generate or add some cards to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lowStabilityCards.map(card => {
                const stability = card.stability || 0;
                // Stability in range 0–10 for a meaningful bar (10d = "strong")
                const stabilityPct = Math.min(stability / 10, 1) * 100;
                const lastReview = card.lastReviewedAt
                  ? new Date(card.lastReviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Never';

                return (
                  <div key={card.id} className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium text-gray-200 text-sm line-clamp-2 flex-1">
                        {card.front}
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0 bg-gray-700">
                        {stability.toFixed(1)}d
                      </Badge>
                    </div>

                    {/* Stability bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${stability < 2 ? 'bg-red-500' :
                              stability < 5 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.max(stabilityPct, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        Last: {lastReview}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Collections Overview ── */}
      {collections.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-4">📚 Collections</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(collection => {
              const collectionCards = cardsArray.filter(
                c => c.collectionId === collection.id
              );
              const retention = estimateCollectionRetention(collectionCards);
              const now = new Date();
              const dueCount = collectionCards.filter(card =>
                !card.nextReviewAt || new Date(card.nextReviewAt) <= now
              ).length;

              return (
                <div
                  key={collection.id}
                  className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/60 hover:border-gray-500/60 transition"
                >
                  <div className="font-medium text-gray-200 truncate mb-2">
                    {collection.name}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>{collectionCards.length} cards</span>
                      {dueCount > 0 && (
                        <span className="text-orange-400 font-semibold">{dueCount} due</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">R:</span>
                      <Progress value={retention * 100} className="h-1 flex-1" />
                      <span className="text-gray-300 font-semibold">
                        {(retention * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty state when no collections */}
      {collections.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-800/50 border-dashed p-12 text-center">
          <div className="text-5xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No collections yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Create a collection from the sidebar, or generate flashcards from a chat conversation to get started.
          </p>
        </Card>
      )}
    </div>
  );
}

```

## File: src/components/flashcards/INTEGRATION_EXAMPLE.jsx

```jsx
/**
 * FILE: src/components/flashcards/INTEGRATION_EXAMPLE.jsx
 * DESCRIPTION: Example showing how to integrate FSRS flashcards into existing chat UI
 * 
 * This demonstrates:
 * 1. How to replace existing FlashcardsPanel with new FSRS system
 * 2. How to wire AI generation into collections
 * 3. How to add initialization hook
 */

/**
 * EXAMPLE 1: Using in existing SECONDARY_ChatLayout
 * 
 * Replace or enhance the flashcards tab with:
 */

// import FlashcardsLayout from '@/components/flashcards/FlashcardsLayout';
// import useFlashcardsInit from '@/hooks/useFlashcardsInit';
//
// export default function SECONDARY_ChatLayout() {
//   const { isReady } = useFlashcardsInit();
//
//   const [activeTab, setActiveTab] = useState('chat');
//   const [currentChatId, setCurrentChatId] = useState(null);
//
//   if (activeTab === 'flashcards' && isReady) {
//     return <FlashcardsLayout chatId={currentChatId} />;
//   }
//
//   // ... rest of layout
// }

/**
 * EXAMPLE 2: Using FlashcardsIntegration for AI generation
 * 
 * When user generates flashcards from selected messages:
 */

// import FlashcardsIntegration from '@/components/flashcards/FlashcardsIntegration';
//
// export default function SECONDARY_ChatWindow() {
//   const [selectedMessageIds, setSelectedMessageIds] = useState([]);
//   const [showFlashcardsGenerator, setShowFlashcardsGenerator] = useState(false);
//
//   if (showFlashcardsGenerator) {
//     return (
//       <FlashcardsIntegration
//         chatId={currentChatId}
//         selectedMessageIds={selectedMessageIds}
//         onGenerateComplete={() => {
//           setShowFlashcardsGenerator(false);
//           // Navigate to flashcards tab
//         }}
//       />
//     );
//   }
//
//   // ... rest of chat window
// }

/**
 * EXAMPLE 3: Direct usage of review component
 */

// import ReviewQueue from '@/components/flashcards/ReviewQueue';
// import { loadCollectionCards } from '@/utils/flashcardIO';
//
// export default function ReviewPage({ collectionId }) {
//   const [cards, setCards] = useState([]);
//
//   useEffect(() => {
//     const collectionCards = loadCollectionCards(collectionId);
//     setCards(collectionCards);
//   }, [collectionId]);
//
//   return (
//     <ReviewQueue
//       cards={cards}
//       collectionId={collectionId}
//       targetRetention={0.9}
//       onQueueEmpty={() => console.log('Session complete')}
//     />
//   );
// }

/**
 * EXAMPLE 4: Using helpers programmatically
 */

// import {
//   estimateR,
//   applyReviewUpdate,
//   getDueCards,
//   estimateCollectionRetention,
// } from '@/lib/helpers/flashcardHelpers';
//
// // Get due cards for today
// const dueToday = getDueCards(allCards, new Date());
// console.log(`${dueToday.length} cards due today`);
//
// // Simulate a review
// const card = allCards[0];
// const updated = applyReviewUpdate(card, 4, new Date(), 0.9);
// console.log(`Next review: ${updated.nextReviewAt}`);
//
// // Calculate collection retention
// const retention = estimateCollectionRetention(allCards);
// console.log(`Average retention: ${(retention * 100).toFixed(0)}%`);

/**
 * EXAMPLE 5: Programmatic collection management
 */

// import {
//   createCollection,
//   createCard,
//   persistCollection,
//   persistCard,
//   loadCollections,
//   loadCollectionCards,
// } from '@/utils/flashcardIO';
//
// // Create a collection
// const collection = createCollection({
//   name: 'Biology 101',
//   source: 'user',
// });
//
// // Add cards
// for (let i = 0; i < 5; i++) {
//   const card = createCard({
//     front: `Question ${i}?`,
//     back: `Answer ${i}`,
//     collectionId: collection.id,
//     tags: ['biology'],
//   });
//
//   collection.cardIds.push(card.id);
//   persistCard(card);
// }
//
// // Save collection
// persistCollection(collection);
//
// // Load later
// const allCollections = loadCollections();
// const collectionCards = loadCollectionCards(collection.id);

/**
 * EXAMPLE 6: Data import/export
 */

// import {
//   exportCollectionAsJSON,
//   exportCollectionAsAnkiCSV,
//   importFlashcardData,
// } from '@/utils/flashcardIO';
//
// // Export as JSON
// const jsonData = exportCollectionAsJSON(cards);
// const blob = new Blob([jsonData], { type: 'application/json' });
// const url = URL.createObjectURL(blob);
// const a = document.createElement('a');
// a.href = url;
// a.download = 'flashcards.json';
// a.click();
//
// // Export as Anki CSV
// const csvData = exportCollectionAsAnkiCSV(cards, 'My Deck');
// // ... similar download process

/**
 * EXAMPLE 7: Migration and initialization
 */

// import {
//   runStorageMigration,
//   seedDevelopmentData,
//   exportAllFlashcardData,
// } from '@/lib/flashcardMigration';
//
// // Run migration (safe, only adds missing fields)
// const { collections, cards, migrated } = runStorageMigration();
// if (migrated) {
//   console.log('✅ Data migrated to FSRS format');
// }
//
// // Seed development data
// if (isDevelopment) {
//   const { collection, cards } = seedDevelopmentData();
//   console.log('Sample collection created:', collection.name);
// }
//
// // Backup
// const backup = exportAllFlashcardData();
// localStorage.setItem('flashcard_backup', JSON.stringify(backup));

/**
 * EXAMPLE 8: Dashboard integration
 */

// import FlashcardDashboard from '@/components/flashcards/FlashcardDashboard';
//
// export default function Dashboard() {
//   const [collections, setCollections] = useState([]);
//   const [allCards, setAllCards] = useState({});
//
//   useEffect(() => {
//     const loaded = loadCollections();
//     setCollections(loaded);
//
//     const cardMap = {};
//     loaded.forEach(col => {
//       const cards = loadCollectionCards(col.id);
//       cards.forEach(card => {
//         cardMap[card.id] = card;
//       });
//     });
//     setAllCards(cardMap);
//   }, []);
//
//   return <FlashcardDashboard collections={collections} allCards={allCards} />;
// }

/**
 * EXAMPLE 9: Configuration and feature flags
 */

// import {
//   FEATURE_FLASHCARDS_FSRS,
//   FSRS_CONFIG,
//   getEffectiveTargetRetention,
// } from '@/lib/config/flashcardsConfig';
//
// if (!FEATURE_FLASHCARDS_FSRS) {
//   console.log('Flashcards feature is disabled');
//   return null;
// }
//
// // Use config
// console.log('Default target retention:', FSRS_CONFIG.DEFAULT_TARGET_RETENTION);
// console.log('Min interval:', FSRS_CONFIG.MIN_INTERVAL, 'days');
//
// // Get effective value with fallback
// const retention = getEffectiveTargetRetention(collection?.settings?.targetRetention);

/**
 * EXAMPLE 10: Custom scheduling (for advanced usage)
 */

// import { applyReviewUpdate, getDueCards } from '@/lib/helpers/flashcardHelpers';
// import { persistCard } from '@/utils/flashcardIO';
//
// // Batch process all cards
// const allCards = loadAllCards();
// const now = new Date();
//
// allCards.forEach(card => {
//   if (isCardDueToday(card, now)) {
//     // Simulate user rating or apply custom logic
//     const quality = calculateQuality(card); // your logic
//     const updated = applyReviewUpdate(card, quality, now, 0.9);
//     persistCard(updated);
//   }
// });

// ============================================================
// MIGRATION GUIDE: Updating SECONDARY_FlashcardsPanel
// ============================================================
//
// OLD (src/components/SECONDARY_FlashcardsPanel.jsx):
//   - One-shot AI generation
//   - Static card display
//   - No scheduling
//
// NEW:
//   - AI generation creates persistent collections
//   - Full review workflow with FSRS scheduling
//   - User-created cards and manual collections
//   - Dashboard and analytics
//   - "How it Works" documentation
//
// TO MIGRATE:
//
// 1. Keep SECONDARY_FlashcardsPanel as-is for backward compatibility
// 2. In SECONDARY_ChatLayout, add a NEW tab or replace the tab content:
//
//    {activeTab === 'flashcards' && (
//      <FlashcardsLayout chatId={currentChatId} />
//    )}
//
// 3. Update the button that triggers generation to use FlashcardsIntegration:
//
//    onClick={() => {
//      setShowFlashcardsGenerator(true);
//    }}
//
// 4. Add useFlashcardsInit hook to app root for initialization
//
// This approach:
// ✅ Doesn't break existing code
// ✅ Gradually transitions users to new system
// ✅ Allows A/B testing if needed
// ✅ Can be feature-flagged with FEATURE_FLASHCARDS_FSRS

export default function IntegrationExample() {
  return <div>See comments in this file for integration examples</div>;
}

```

## File: src/components/flashcards/FlashcardsDocPopup.jsx

```jsx
/**
 * FILE: src/components/flashcards/FlashcardsDocPopup.jsx
 * DESCRIPTION: Interactive documentation popup explaining FSRS-lite algorithm
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { simulateExample } from '@/lib/helpers/flashcardHelpers';

export default function FlashcardsDocPopup({
  isOpen = false,
  onClose,
  imageUrl = null,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExample, setShowExample] = useState(false);
  const example = simulateExample();

  const handleExportPDF = () => {
    alert('PDF export coming soon! For now, use your browser print function (Ctrl+P).');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Flashcards Work (FSRS-lite)</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
            <TabsTrigger value="example">Example</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">What is FSRS?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                FSRS stands for <strong>Free Spaced Repetition Scheduler</strong>. It's a scientific
                algorithm for optimizing how often you review material to maximize long-term retention
                while minimizing study time.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Core Concepts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-purple-300">📊 Stability (S)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    How strong your memory is for a card (in days). Higher stability = you can wait longer
                    before reviewing.
                  </p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-blue-300">⚡ Difficulty (D)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    How hard the material is (scale 1-10). Harder cards require more frequent reviews.
                  </p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-green-300">🎯 Retrievability (R)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated probability you'll remember (0-100%). Decays over time until you review.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">The Formula</h3>
              <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg font-mono text-xs">
                <div className="text-purple-300">R(t) = e^(-t / S)</div>
                <p className="text-gray-400 text-xs mt-2">
                  Your recall probability decays exponentially. Each review increases Stability, pushing
                  the decay curve outward.
                </p>
              </div>
            </div>

            {/* Optional image */}
            {imageUrl && (
              <div>
                <h3 className="font-semibold mb-2">Visualization</h3>
                <img
                  src={imageUrl}
                  alt="Spaced repetition timeline"
                  className="w-full rounded-lg border border-gray-700"
                />
              </div>
            )}

            {/* Fallback SVG if no image */}
            {!imageUrl && (
              <div>
                <h3 className="font-semibold mb-2">Review Timeline</h3>
                <svg viewBox="0 0 600 300" className="w-full bg-gray-800 rounded-lg">
                  {/* X axis */}
                  <line x1="40" y1="250" x2="560" y2="250" stroke="#666" strokeWidth="2" />
                  <text x="570" y="255" fontSize="12" fill="#aaa">
                    Days
                  </text>

                  {/* Y axis */}
                  <line x1="40" y1="40" x2="40" y2="250" stroke="#666" strokeWidth="2" />
                  <text x="15" y="45" fontSize="12" fill="#aaa">
                    R(t)
                  </text>

                  {/* Curve before first review */}
                  <path
                    d="M 60 60 Q 150 100 250 200"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />

                  {/* Review point 1 */}
                  <circle cx="250" cy="200" r="4" fill="#ffd700" />
                  <text x="250" y="220" fontSize="11" fill="#ffd700" textAnchor="middle">
                    Review 1
                  </text>

                  {/* Curve after review 1 */}
                  <path
                    d="M 250 200 Q 350 160 450 220"
                    stroke="#4ecdc4"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* Review point 2 */}
                  <circle cx="450" cy="220" r="4" fill="#ffd700" />
                  <text x="450" y="240" fontSize="11" fill="#ffd700" textAnchor="middle">
                    Review 2
                  </text>

                  {/* Legend */}
                  <text x="60" y="30" fontSize="11" fill="#aaa">
                    🔴 Decay without review | 🔵 Growth after review
                  </text>
                </svg>
              </div>
            )}
          </TabsContent>

          {/* Algorithm Tab */}
          <TabsContent value="algorithm" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Update Rules</h3>
              <p className="text-gray-400 text-sm mb-3">
                When you review a card, we update S and D based on your rating:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="font-semibold text-red-300">❌ Again (0)</div>
                  <div className="text-xs text-gray-300 mt-1 font-mono">
                    S_new = max(0.5, S × 0.5)
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Stability cuts in half. Difficulty increases. Lapses count up.
                  </p>
                </div>

                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="font-semibold text-yellow-300">🟡 Hard (3)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Smaller stability gain. Difficulty rises slightly. Review sooner.
                  </p>
                </div>

                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="font-semibold text-green-300">✅ Good (4)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Solid stability gain. Difficulty decreases slightly. Standard interval.
                  </p>
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="font-semibold text-blue-300">🎯 Easy (5)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Large stability gain. Difficulty decreases. Longest interval.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Calculation</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-gray-800 rounded font-mono">
                  gain = 0.18 × f(q) × (1 + (1 - R))
                </div>
                <div className="p-2 bg-gray-800 rounded font-mono">
                  S_new = S × (1 + gain)
                </div>
                <div className="p-2 bg-gray-800 rounded font-mono">
                  t_next = -S × ln(targetRetention)
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                The algorithm boosts gains when you recall just before forgetting, ensuring efficient
                spacing.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-200">
                💡 <strong>Key insight:</strong> This is FSRS-lite. The full FSRS v4 includes advanced
                parameter optimization and additional factors.
              </p>
            </div>
          </TabsContent>

          {/* Example Tab */}
          <TabsContent value="example" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Worked Example</h3>
              <p className="text-gray-400 text-sm mb-4">
                Watch how a card evolves through reviews:
              </p>
            </div>

            {/* Initial card */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="font-semibold text-gray-200 mb-2">Initial Card</div>
              <div className="text-sm text-gray-300">
                <strong>Q:</strong> {example.initial.front}
              </div>
              <div className="text-sm text-gray-300">
                <strong>A:</strong> {example.initial.back}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">S: {example.initial.stability}d</Badge>
                <Badge variant="secondary">D: {example.initial.difficulty}</Badge>
              </div>
            </div>

            {/* Review 1 */}
            <div className="p-4 bg-green-900/10 rounded-lg border border-green-700">
              <div className="font-semibold text-green-300 mb-2">
                ✅ Review 1: Rated "{example.review1.rating}"
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Date: {new Date(example.review1.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-300 mb-3">{example.review1.explanation}</div>
              <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                <div>
                  <strong>S:</strong> {example.initial.stability} → {example.review1.result.stability.toFixed(2)}d
                </div>
                <div>
                  <strong>D:</strong> {example.initial.difficulty} → {example.review1.result.difficulty.toFixed(2)}
                </div>
                <div>
                  <strong>Next review:</strong> {new Date(example.review1.result.nextReviewAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-700">
              <div className="font-semibold text-blue-300 mb-2">
                🎯 Review 2: Rated "{example.review2.rating}"
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Date: {new Date(example.review2.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-300 mb-3">{example.review2.explanation}</div>
              <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                <div>
                  <strong>S:</strong> {example.review1.result.stability.toFixed(2)} →{' '}
                  {example.review2.result.stability.toFixed(2)}d
                </div>
                <div>
                  <strong>D:</strong> {example.review1.result.difficulty.toFixed(2)} →{' '}
                  {example.review2.result.difficulty.toFixed(2)}
                </div>
                <div>
                  <strong>Next review:</strong> {new Date(example.review2.result.nextReviewAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <Button onClick={() => setShowExample(!showExample)} variant="outline" className="w-full">
              {showExample ? 'Hide' : 'Show'} Step-by-Step Calculation
            </Button>

            {showExample && (
              <div className="p-4 bg-purple-900/10 rounded-lg border border-purple-700 text-xs font-mono space-y-2">
                <div>
                  <span className="text-gray-400">Review 1 calculations:</span>
                </div>
                <div className="text-gray-300">
                  f(4) = (4 - 2) / 3 = 0.667 (Good rating factor)
                </div>
                <div className="text-gray-300">
                  gain = 0.18 × 0.667 = 0.12
                </div>
                <div className="text-gray-300">
                  S_new = 3 × (1 + 0.12) = 3.36d
                </div>
              </div>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Why did my intervals increase?
              </h4>
              <p className="text-sm text-gray-400">
                A: Whenever you rate a card "Hard", "Good", or "Easy", your stability increases.
                Higher stability = longer intervals before the next review.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: What are "Lapses"?
              </h4>
              <p className="text-sm text-gray-400">
                A: A lapse is when you fail to recall a card (rate "Again"). Lapses are tracked to help
                identify problematic cards and adjust difficulty.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Should I increase or decrease target retention?
              </h4>
              <p className="text-sm text-gray-400">
                A: <strong>90% is recommended</strong>. Lower values (70-80%) require more daily reviews but
                higher retention. Higher values (95%+) reduce review load but risk forgetting.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Can I snooze a review?
              </h4>
              <p className="text-sm text-gray-400">
                A: Yes, use the "Skip" button during review. But be careful—the algorithm already
                optimizes timing. Frequent snoozing reduces learning efficiency.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: How do I export my cards?
              </h4>
              <p className="text-sm text-gray-400">
                A: Use the "Export" button on your collection. We support Anki (.apkg) and JSON formats
                so you can use cards in other tools.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex gap-2 justify-end border-t border-gray-800 pt-4 mt-4">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            📄 Export PDF
          </Button>
          <Button onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

## File: src/components/flashcards/CollectionList.jsx

```jsx
/**
 * FILE: src/components/flashcards/CollectionList.jsx
 * DESCRIPTION: Sidebar list of collections
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CollectionList({
  collections = [],
  activeCollectionId = null,
  onSelectCollection,
  onCreateCollection,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = collections.filter(col =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-3 bg-gray-900 rounded-lg border border-gray-800 p-4">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-200">Collections</h3>

        {/* Create new button */}
        <Button
          onClick={onCreateCollection}
          className="w-full bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95"
          size="sm"
        >
          ➕ New Collection
        </Button>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Collections list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              {collections.length === 0
                ? 'No collections yet'
                : 'No collections match your search'}
            </div>
          ) : (
            filtered.map(collection => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection(collection.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeCollectionId === collection.id
                    ? 'bg-purple-900/30 border-purple-600 text-gray-100'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium truncate">{collection.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {collection.cardIds?.length || 0} cards
                </div>
                {collection.source === 'ai' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    AI Generated
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      {collections.length > 0 && (
        <div className="border-t border-gray-800 pt-3 text-xs text-gray-400">
          <div className="text-center">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} •{' '}
            {collections.reduce((sum, c) => sum + (c.cardIds?.length || 0), 0)} total cards
          </div>
        </div>
      )}
    </div>
  );
}

```

## File: src/components/flashcards/TESTING_GUIDE.md

/**
 * FILE: src/components/flashcards/TESTING_GUIDE.md
 * DESCRIPTION: Manual testing and acceptance criteria for FSRS flashcard system
 */

# FSRS Flashcard System - Testing Guide

## Overview

This document outlines manual testing steps and acceptance criteria for the FSRS-lite flashcard implementation.

## Pre-flight Checklist

- [ ] Browser console has no errors
- [ ] localStorage is available (not in private mode)
- [ ] Feature flag `FEATURE_FLASHCARDS_FSRS` is enabled
- [ ] All component files imported correctly

## Manual Testing Scenarios

### Scenario 1: Create a Manual Collection

**Steps:**
1. Open the Flashcards interface
2. Click "New Collection" button in sidebar
3. Enter collection name: "Test Collection"
4. Verify collection appears in sidebar list

**Expected Results:**
- Collection created with unique ID
- Collection appears highlighted in sidebar
- Shows "0 cards" until cards are added
- Created timestamp is set

**Pass/Fail:** ___

---

### Scenario 2: Add a Card Manually

**Steps:**
1. With a collection open, click "Add Card" button
2. Enter front: "What is the capital of France?"
3. Enter back: "Paris"
4. Add tags: "geography", "capitals"
5. Click "Save Card"

**Expected Results:**
- Modal closes
- Card appears in collection grid
- Shows front, back preview
- Shows stability and difficulty values
- Tags are visible

**Pass/Fail:** ___

---

### Scenario 3: Edit an Existing Card

**Steps:**
1. Click on a card in the collection grid
2. Card editor modal opens
3. Modify front or back text
4. Click "Save Card"

**Expected Results:**
- Card updates immediately in grid
- New text is displayed
- No duplicate cards created

**Pass/Fail:** ___

---

### Scenario 4: Review Session with Rating

**Steps:**
1. In a collection with at least 3 cards, click "Review X Cards"
2. Card appears with question showing
3. Press space (or click) to flip and reveal answer
4. Rate the card as "Good" (press 3 or click button)
5. Next card loads
6. Complete rating for remaining cards
7. See session summary

**Expected Results:**
- Card flips smoothly with answer visible
- Rating buttons only show after flip
- Rating disappears, next card loads
- Progress bar updates
- Session stats show counts (Again/Hard/Good/Easy)
- Cards marked as reviewed cannot be selected again today

**Pass/Fail:** ___

---

### Scenario 5: Keyboard Shortcuts

**Steps:**
1. Start a review session
2. Test space bar to flip
3. Test 1, 2, 3, 4 keys to rate

**Expected Results:**
- Space flips card
- 1 = Again
- 2 = Hard
- 3 = Good
- 4 = Easy
- Card advances on rating

**Pass/Fail:** ___

---

### Scenario 6: FSRS Algorithm Validation

**Steps:**
1. Create a card with default S=3, D=5
2. Rate it "Good" (quality=4)
3. Check updated stability

**Expected Results:**
- Stability increased (should be > 3)
- Difficulty slightly decreased (should be < 5)
- nextReviewAt is set to future date
- History entry created with timestamp and quality

**Calculation verification:**
```
gain = 0.18 × (2/3) × (1 + (1 - R))
# If R=1 (just reviewed): gain = 0.12
S_new = 3 × (1 + 0.12) = 3.36
# Expected: S_new ≈ 3.36 days
```

**Pass/Fail:** ___

---

### Scenario 7: Due Cards Filtering

**Steps:**
1. Create collection with 5 cards
2. Set some cards' nextReviewAt to today (via console or logic)
3. Set others to future dates
4. Check "Start Review" button

**Expected Results:**
- Button shows count of due cards only
- Review queue displays only due cards
- Future cards not shown

**Pass/Fail:** ___

---

### Scenario 8: Dashboard Statistics

**Steps:**
1. Open dashboard with 1-2 collections
2. Verify cards are visible
3. Check retention percentage calculated
4. Check daily stats panel
5. Verify upcoming schedule shows cards

**Expected Results:**
- Total cards counted correctly
- Average retention displays (0-100%)
- Due today count is accurate
- Collections overview shown
- Upcoming cards listed with intervals

**Pass/Fail:** ___

---

### Scenario 9: Collection Settings

**Steps:**
1. Open collection and click "Actions" → "Settings"
2. Adjust target retention to 80%
3. Adjust max reviews to 20
4. Save

**Expected Results:**
- Settings modal opens
- Values display correctly
- Settings persist after save
- Closing and reopening shows saved values

**Pass/Fail:** ___

---

### Scenario 10: Documentation Popup

**Steps:**
1. Click "ℹ️ Help" button
2. Tab through Overview, Algorithm, Example, FAQ
3. Click "Show worked example"
4. Try "Export PDF"

**Expected Results:**
- Popup opens with tabs
- Each tab content displays clearly
- Example shows card progression
- Step-by-step calculation visible
- Formulas display correctly
- FAQ answers clear

**Pass/Fail:** ___

---

### Scenario 11: Export to JSON

**Steps:**
1. Collection with 3+ cards
2. Click Actions → Export
3. Choose "json" format
4. Save file
5. Open JSON file in text editor

**Expected Results:**
- File downloads with name format: `CollectionName.json`
- JSON is valid and readable
- Contains all cards with FSRS fields
- Can be imported later

**Pass/Fail:** ___

---

### Scenario 12: Export to Anki CSV

**Steps:**
1. Collection with cards
2. Click Actions → Export
3. Choose "anki" format
4. File downloads
5. Open in text editor or import to Anki

**Expected Results:**
- File downloads as `.csv`
- Headers include Anki format
- Cards formatted with tabs/newlines
- Compatible with Anki import

**Pass/Fail:** ___

---

### Scenario 13: Forgotten Card (Again Rating)

**Steps:**
1. Create card with S=6, D=5
2. Rate it "Again" (quality=0)

**Expected Results:**
- Stability reduced to ~3 (half with 0.5 floor)
- Difficulty increased to ~5.5
- Lapses incremented to 1
- Card due sooner (nextReviewAt closer)
- History shows quality=0 entry

**Pass/Fail:** ___

---

### Scenario 14: Easy Rating (Easy Recall)

**Steps:**
1. Create card with S=3, D=5
2. Rate it "Easy" (quality=5)

**Expected Results:**
- Stability increased significantly
- Difficulty decreased to ~4
- nextReviewAt pushed far into future
- Largest interval among all ratings

**Pass/Fail:** ___

---

### Scenario 15: Data Persistence

**Steps:**
1. Create collection with 5 cards
2. Rate some cards
3. Close browser tab
4. Reopen app
5. Verify collection and review history still present

**Expected Results:**
- Collections reload from localStorage
- Cards with updated S/D/nextReviewAt preserved
- Review history intact
- Can continue reviewing without loss

**Pass/Fail:** ___

---

### Scenario 16: Empty Collection

**Steps:**
1. Create collection
2. Click "Start Review" without adding cards

**Expected Results:**
- "No reviews due" message displayed
- Helpful message shown
- No error thrown

**Pass/Fail:** ___

---

### Scenario 17: Delete Collection

**Steps:**
1. Collection with cards
2. Click Actions → Delete Collection
3. Confirm deletion

**Expected Results:**
- Confirmation dialog shown
- Collection and all cards removed
- Sidebar refreshes
- No cards orphaned in storage

**Pass/Fail:** ___

---

### Scenario 18: Collection Copy Limit

**Steps:**
1. Add multiple tags to card
2. Try to remove tag by clicking X badge
3. Add new tag

**Expected Results:**
- Tags removable individually
- Can add/remove without conflicts

**Pass/Fail:** ___

---

### Scenario 19: Search Collections

**Steps:**
1. Create 5 collections with different names
2. Type search query in sidebar
3. Filter results
4. Clear search

**Expected Results:**
- Collections filtered by name
- Partial matches work
- Case-insensitive
- Clear returns full list

**Pass/Fail:** ___

---

## Unit Test Checklist

Run these programmatic tests:

```javascript
// Test 1: Recall probability decay
import { estimateR } from '@/lib/helpers/flashcardHelpers';
const r = estimateR(1, 10);
console.assert(Math.abs(r - Math.exp(-0.1)) < 0.001, 'estimateR failed');

// Test 2: Forgotten card reduces stability
const card = { stability: 4, difficulty: 5, lapses: 0, history: [] };
const updated = applyReviewUpdate(card, 0, new Date());
console.assert(updated.stability === 2, 'Again stability failed');
console.assert(updated.lapses === 1, 'Lapses not incremented');

// Test 3: Good rating increases stability
const card2 = { stability: 3, difficulty: 5, lapses: 0, history: [] };
const updated2 = applyReviewUpdate(card2, 4, new Date());
console.assert(updated2.stability > 3, 'Good stability gain failed');

// Test 4: Easy rating largest gain
const card3 = { stability: 3, difficulty: 5, lapses: 0, history: [] };
const easyUpdate = applyReviewUpdate(card3, 5, new Date());
const goodUpdate = applyReviewUpdate(card3, 4, new Date());
console.assert(easyUpdate.stability > goodUpdate.stability, 'Easy gain not largest');

// Test 5: Migration adds default fields
import { migrateCard } from '@/lib/helpers/flashcardHelpers';
const oldCard = { front: 'Q', back: 'A' };
const migrated = migrateCard(oldCard);
console.assert(migrated.stability === 3, 'Migration default stability failed');
console.assert(migrated.difficulty === 5, 'Migration default difficulty failed');
console.assert(migrated.lapses === 0, 'Migration default lapses failed');
```

**All pass:** ___

---

## Accessibility Testing

- [ ] Can tab through all buttons
- [ ] Cards flip with keyboard
- [ ] Rating buttons accessible
- [ ] Modals have proper focus
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces card content

---

## Performance Testing

- [ ] Load 100 cards - list loads smoothly
- [ ] Review session maintains 60 FPS
- [ ] No memory leaks over 10 min session
- [ ] localStorage doesn't exceed 5MB

---

## Edge Cases

- [ ] Very long card text (> 1000 chars)
- [ ] Many tags (50+)
- [ ] Rapid rating clicks
- [ ] Browser back button during review
- [ ] Network offline (graceful degradation)
- [ ] localStorage quota exceeded

---

## Sign-off

| Scenario | Result | Notes |
|----------|--------|-------|
| 1. Manual Collection | ___ | |
| 2. Add Card | ___ | |
| 3. Edit Card | ___ | |
| 4. Review Session | ___ | |
| 5. Keyboard Shortcuts | ___ | |
| 6. Algorithm Validation | ___ | |
| 7. Due Filtering | ___ | |
| 8. Dashboard | ___ | |
| 9. Settings | ___ | |
| 10. Documentation | ___ | |
| 11. Export JSON | ___ | |
| 12. Export Anki | ___ | |
| 13. Forgotten Card | ___ | |
| 14. Easy Card | ___ | |
| 15. Persistence | ___ | |
| 16. Empty Collection | ___ | |
| 17. Delete Collection | ___ | |
| 18. Tags | ___ | |
| 19. Search | ___ | |

**Overall Status:** ___

**Tested By:** ___

**Date:** ___

**Notes:**



## File: src/components/flashcards/FlashcardsLayout.jsx

```jsx
/**
 * FILE: src/components/flashcards/FlashcardsLayout.jsx
 * DESCRIPTION: Main flashcards layout - orchestrates collections, review, dashboard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import CollectionList from './CollectionList';
import CollectionHeader from './CollectionHeader';
import ReviewQueue from './ReviewQueue';
import FlashcardDashboard from './FlashcardDashboard';
import CardEditorModal from './CardEditorModal';
import CollectionSettings from './CollectionSettings';
import FlashcardsDocPopup from './FlashcardsDocPopup';
import { Button } from '@/components/ui/button';
import {
  loadCollections,
  loadCollectionCards,
  persistCollection,
  persistCard,
  createCollection,
  createCard,
  deleteCollection,
  importAIGeneratedCards,
  exportCollectionAsJSON,
  exportCollectionAsAnkiCSV,
} from '@/utils/flashcardIO';
import { getDailyStats } from '@/lib/helpers/flashcardHelpers';

const VIEWS = {
  DASHBOARD: 'dashboard',
  COLLECTION: 'collection',
  REVIEW: 'review',
};

export default function FlashcardsLayout({ chatId = null, onGenerateFlashcards = null }) {
  // Collections
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [allCards, setAllCards] = useState({});

  // UI State
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocPopupOpen, setIsDocPopupOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Load collections on mount
  useEffect(() => {
    const loaded = loadCollections();
    setCollections(loaded);

    // Load all cards
    const cardMap = {};
    loaded.forEach(collection => {
      const collectionCards = loadCollectionCards(collection.id);
      collectionCards.forEach(card => {
        cardMap[card.id] = card;
      });
    });
    setAllCards(cardMap);

    // Select first collection if available
    if (loaded.length > 0 && !activeCollectionId) {
      setActiveCollectionId(loaded[0].id);
    }
  }, []);

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeCollectionCards = activeCollection
    ? Object.values(allCards).filter(c => c.collectionId === activeCollection.id)
    : [];

  // Handle collection selection
  const handleSelectCollection = useCallback((collectionId) => {
    setActiveCollectionId(collectionId);
    setCurrentView(VIEWS.COLLECTION);
  }, []);

  // Handle create collection
  const handleCreateCollection = useCallback(async () => {
    const name = prompt('Collection name:', 'New Collection');
    if (!name) return;

    const newCollection = createCollection({
      name,
      source: 'user',
      cardIds: [],
    });

    setCollections(prev => [...prev, newCollection]);
    persistCollection(newCollection);
    setActiveCollectionId(newCollection.id);
    setCurrentView(VIEWS.COLLECTION);
  }, []);

  // Handle add card
  const handleAddCard = useCallback(async (cardData) => {
    if (!activeCollection) return;

    const newCard = createCard({
      ...cardData,
      collectionId: activeCollection.id,
    });

    setAllCards(prev => ({ ...prev, [newCard.id]: newCard }));
    persistCard(newCard);

    // Add to collection
    const updated = {
      ...activeCollection,
      cardIds: [...(activeCollection.cardIds || []), newCard.id],
    };
    setCollections(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    persistCollection(updated);
  }, [activeCollection]);

  // Handle save card
  const handleSaveCard = useCallback(async (cardData) => {
    await handleAddCard(cardData);
    setIsCardEditorOpen(false);
    setEditingCard(null);
  }, [handleAddCard]);

  // Handle start review
  const handleStartReview = useCallback(() => {
    if (activeCollection && activeCollectionCards.length > 0) {
      setCurrentView(VIEWS.REVIEW);
    }
  }, [activeCollection, activeCollectionCards]);

  // Handle individual card reviewed — update in-memory state immediately
  // so the dashboard due-count reflects the review right away
  const handleCardReviewed = useCallback((updatedCard) => {
    setAllCards(prev => ({
      ...prev,
      [updatedCard.id]: updatedCard,
    }));
  }, []);

  // Handle review session complete
  const handleReviewComplete = useCallback(() => {
    setCurrentView(VIEWS.COLLECTION);
    // Re-read from localStorage to ensure full consistency
    if (activeCollection) {
      const updated = loadCollectionCards(activeCollection.id);
      const newCardMap = { ...allCards };
      updated.forEach(card => {
        newCardMap[card.id] = card;
      });
      setAllCards(newCardMap);
    }
  }, [activeCollection, allCards]);

  // Handle save settings
  const handleSaveSettings = useCallback(async (settings) => {
    if (!activeCollection) return;

    const updated = {
      ...activeCollection,
      settings: {
        ...activeCollection.settings,
        ...settings,
      },
    };

    setCollections(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    persistCollection(updated);
    setIsSettingsOpen(false);
  }, [activeCollection]);

  // Handle delete collection
  const handleDeleteCollection = useCallback(() => {
    if (!activeCollection) return;

    if (
      !confirm(`Are you sure you want to delete "${activeCollection.name}"? This cannot be undone.`)
    ) {
      return;
    }

    deleteCollection(activeCollection.id);
    setCollections(prev => prev.filter(c => c.id !== activeCollection.id));

    // Remove cards from cardMap
    const newCardMap = { ...allCards };
    Object.keys(newCardMap).forEach(id => {
      if (newCardMap[id].collectionId === activeCollection.id) {
        delete newCardMap[id];
      }
    });
    setAllCards(newCardMap);

    setActiveCollectionId(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, [activeCollection, allCards]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!activeCollection || activeCollectionCards.length === 0) {
      alert('No cards to export');
      return;
    }

    // Show export format choice
    const format = prompt(
      'Export format?\nEnter: json or anki',
      'json'
    );

    if (!format) return;

    let data;
    let filename;

    if (format.toLowerCase() === 'anki') {
      data = exportCollectionAsAnkiCSV(activeCollectionCards, activeCollection.name);
      filename = `${activeCollection.name.replace(/\s+/g, '_')}.csv`;
    } else {
      data = exportCollectionAsJSON(activeCollectionCards);
      filename = `${activeCollection.name.replace(/\s+/g, '_')}.json`;
    }

    // Download
    const blob = new Blob([data], {
      type: format.toLowerCase() === 'anki' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCollection, activeCollectionCards]);

  const dailyStats = getDailyStats(activeCollectionCards);

  return (
    <div className="flex h-full gap-6 bg-gray-950 p-6 rounded-xl border border-gray-800">
      {/* Left sidebar - Collections */}
      <div className="w-64 flex-shrink-0">
        <CollectionList
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={handleCreateCollection}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                onClick={() => setCurrentView(VIEWS.DASHBOARD)}
                variant={currentView === VIEWS.DASHBOARD ? 'default' : 'ghost'}
                className="mr-2"
              >
                📊 Dashboard
              </Button>
              {activeCollection && (
                <>
                  <Button
                    onClick={() => setCurrentView(VIEWS.COLLECTION)}
                    variant={currentView === VIEWS.COLLECTION ? 'default' : 'ghost'}
                    className="mr-2"
                  >
                    📚 Collection
                  </Button>
                  {dailyStats.dueTodayCount > 0 && (
                    <Button
                      onClick={() => setCurrentView(VIEWS.REVIEW)}
                      variant={currentView === VIEWS.REVIEW ? 'default' : 'ghost'}
                      className="mr-2 bg-red-900/30 hover:bg-red-800/40"
                    >
                      🎯 Review ({dailyStats.dueTodayCount})
                    </Button>
                  )}
                </>
              )}
            </div>

            <Button
              onClick={() => setIsDocPopupOpen(true)}
              variant="outline"
              size="sm"
            >
              ℹ️ Help
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === VIEWS.DASHBOARD && (
            <FlashcardDashboard collections={collections} allCards={allCards} />
          )}

          {currentView === VIEWS.COLLECTION && activeCollection && (
            <div className="space-y-6">
              <CollectionHeader
                collection={activeCollection}
                cardCount={activeCollectionCards.length}
                dueCount={dailyStats.dueTodayCount}
                onStartReview={handleStartReview}
                onAddCard={() => {
                  setEditingCard(null);
                  setIsCardEditorOpen(true);
                }}
                onEditSettings={() => setIsSettingsOpen(true)}
                onShowInfo={() => setIsDocPopupOpen(true)}
                onExport={handleExport}
                onDelete={handleDeleteCollection}
              />

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCollectionCards.map(card => (
                  <div
                    key={card.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setEditingCard(card);
                      setIsCardEditorOpen(true);
                    }}
                  >
                    <div className="font-semibold text-gray-200 line-clamp-2">
                      {card.front}
                    </div>
                    <div className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {card.back}
                    </div>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="text-purple-400">S: {(card.stability || 0).toFixed(1)}d</span>
                      <span className="text-blue-400">D: {(card.difficulty || 5).toFixed(1)}</span>
                      <span className="text-gray-500">Lapses: {card.lapses || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === VIEWS.REVIEW && activeCollection && (
            <ReviewQueue
              cards={activeCollectionCards}
              collectionId={activeCollection.id}
              targetRetention={activeCollection.settings?.targetRetention || 0.9}
              onQueueEmpty={handleReviewComplete}
              onCardReviewed={handleCardReviewed}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CardEditorModal
        isOpen={isCardEditorOpen}
        card={editingCard}
        onSave={handleSaveCard}
        onCancel={() => {
          setIsCardEditorOpen(false);
          setEditingCard(null);
        }}
      />

      <CollectionSettings
        isOpen={isSettingsOpen}
        collection={activeCollection}
        onSave={handleSaveSettings}
        onCancel={() => setIsSettingsOpen(false)}
      />

      <FlashcardsDocPopup
        isOpen={isDocPopupOpen}
        onClose={() => setIsDocPopupOpen(false)}
      />
    </div>
  );
}

```

## File: src/components/flashcards/CollectionHeader.jsx

```jsx
/**
 * FILE: src/components/flashcards/CollectionHeader.jsx
 * DESCRIPTION: Header for active collection with actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function CollectionHeader({
  collection,
  cardCount = 0,
  dueCount = 0,
  onStartReview,
  onAddCard,
  onEditSettings,
  onShowInfo,
  onExport,
  onDelete,
}) {
  if (!collection) {
    return (
      <div className="text-center text-gray-400 py-8">
        Select or create a collection to begin
      </div>
    );
  }

  const createdDate = new Date(collection.createdAt).toLocaleDateString();

  return (
    <div className="space-y-4">
      {/* Title and meta */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">{collection.name}</h2>
          <div className="flex gap-3 mt-2">
            <Badge variant="outline">{cardCount} cards</Badge>
            {dueCount > 0 && (
              <Badge className="bg-red-900 text-red-200">
                {dueCount} due today
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {collection.source === 'ai' ? '🤖 AI-Generated' : '👤 Manual'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Created {createdDate}
            </Badge>
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              ⋮ Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Collection Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onStartReview} disabled={dueCount === 0}>
              🎯 Start Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddCard}>
              ➕ Add Card
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditSettings}>
              ⚙️ Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowInfo}>
              ℹ️ How It Works
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              📥 Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-400 focus:text-red-400"
            >
              🗑️ Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2">
        {dueCount > 0 && (
          <Button
            onClick={onStartReview}
            className="bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95"
          >
            🎯 Review {dueCount} Cards
          </Button>
        )}
        <Button onClick={onAddCard} variant="outline">
          ➕ Add Card
        </Button>
      </div>
    </div>
  );
}

```

## File: src/components/flashcards/ReviewCard.jsx

```jsx
/**
 * FILE: src/components/flashcards/ReviewCard.jsx
 * DESCRIPTION: Single card UI with flip animation, rating buttons, and next-interval preview
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { applyReviewUpdate, formatInterval } from '@/lib/helpers/flashcardHelpers';

export default function ReviewCard({
  card,
  cardIndex = 0,
  totalCards = 1,
  onRate,
  isLoading = false,
  targetRetention = 0.9,
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Pre-compute next intervals for each rating option
  const intervals = useMemo(() => {
    if (!card) return {};
    const now = new Date();
    const qualities = [0, 3, 4, 5];
    const result = {};
    qualities.forEach(q => {
      const updated = applyReviewUpdate(card, q, now, targetRetention);
      const nextReview = new Date(updated.nextReviewAt);
      const diffMs = nextReview - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // For very short intervals (Again = 0.5d = 12h), show in hours/minutes
      if (diffDays < 1) {
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 1) {
          result[q] = `${Math.round(diffHours * 60)}m`;
        } else {
          result[q] = `${Math.round(diffHours)}h`;
        }
      } else {
        result[q] = formatInterval(diffDays);
      }
    });
    return result;
  }, [card, targetRetention]);

  const handleRate = (quality) => {
    if (!isLoading && onRate) {
      onRate(quality);
      setIsFlipped(false);
    }
  };

  const handleKeyDown = (e) => {
    if (isFlipped) {
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped(false);
      } else if (e.key === '1') {
        handleRate(0); // Again
      } else if (e.key === '2') {
        handleRate(3); // Hard
      } else if (e.key === '3') {
        handleRate(4); // Good
      } else if (e.key === '4') {
        handleRate(5); // Easy
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsFlipped(true);
    }
  };

  if (!card) {
    return <div className="text-center text-gray-400">No card to review</div>;
  }

  const ratingButtons = [
    {
      quality: 0,
      label: 'Again',
      key: '1',
      borderClass: 'border-red-600 hover:bg-red-950',
      textClass: 'text-red-400',
      intervalClass: 'text-red-300',
    },
    {
      quality: 3,
      label: 'Hard',
      key: '2',
      borderClass: 'border-orange-600 hover:bg-orange-950',
      textClass: 'text-orange-400',
      intervalClass: 'text-orange-300',
    },
    {
      quality: 4,
      label: 'Good',
      key: '3',
      borderClass: 'border-green-600 hover:bg-green-950',
      textClass: 'text-green-400',
      intervalClass: 'text-green-300',
    },
    {
      quality: 5,
      label: 'Easy',
      key: '4',
      borderClass: 'border-blue-600 hover:bg-blue-950',
      textClass: 'text-blue-400',
      intervalClass: 'text-blue-300',
    },
  ];

  return (
    <div
      className="flex flex-col gap-5 w-full max-w-2xl"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Flashcard review"
      tabIndex={0}
    >
      {/* Card position indicator */}
      <div className="text-center text-sm text-gray-500">
        Card <span className="font-semibold text-gray-300">{cardIndex + 1}</span> /{' '}
        <span className="font-semibold text-gray-300">{totalCards}</span>
      </div>

      {/* Card Container with 3D flip */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px', height: '240px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className="w-full h-full relative transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-purple-900/40 to-violet-900/25 rounded-2xl border-2 border-purple-500/60 p-7 flex flex-col items-center justify-center text-center shadow-xl shadow-purple-900/20"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-xs font-semibold text-purple-400 mb-4 uppercase tracking-widest">Question</div>
            <div className="text-xl font-medium text-white leading-relaxed break-words">
              {card.front}
            </div>
            <div className="text-xs text-gray-500 mt-6 italic">
              Click or press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">space</kbd> to reveal
            </div>
          </div>

          {/* Back face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-emerald-900/40 to-green-900/25 rounded-2xl border-2 border-emerald-500/60 p-7 flex flex-col items-center justify-center text-center shadow-xl shadow-green-900/20"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-xs font-semibold text-emerald-400 mb-4 uppercase tracking-widest">Answer</div>
            <div className="text-xl font-medium text-white leading-relaxed break-words">
              {card.back}
            </div>
            <div className="text-xs text-gray-500 mt-6 italic">
              Rate your recall below
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {card.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Rating Buttons — only visible when flipped */}
      <div className={`grid grid-cols-4 gap-3 transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {ratingButtons.map(({ quality, label, key, borderClass, textClass, intervalClass }) => (
          <button
            key={quality}
            onClick={(e) => { e.stopPropagation(); handleRate(quality); }}
            disabled={isLoading || !isFlipped}
            className={`
              flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-transparent
              transition-all duration-200 hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              ${borderClass} ${textClass}
            `}
          >
            <span className="text-xs font-bold opacity-50">{key}</span>
            <span className="text-sm font-bold">{label}</span>
            {/* Next interval preview */}
            <span className={`text-xs font-semibold ${intervalClass}`}>
              {intervals[quality] || '—'}
            </span>
          </button>
        ))}
      </div>

      {/* Card stats row — visible when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 bg-gray-900/60 rounded-xl p-3 border border-gray-800">
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{(card.stability || 0).toFixed(1)}d</div>
            <div className="text-gray-500">Stability</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{(card.difficulty || 5).toFixed(1)}</div>
            <div className="text-gray-500">Difficulty</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{card.lapses || 0}</div>
            <div className="text-gray-500">Lapses</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{card.history ? card.history.length : 0}</div>
            <div className="text-gray-500">Reviews</div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center">
        💡 Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">space</kbd> to flip
        {isFlipped && (
          <> | <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">1</kbd>
            {' '}<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">2</kbd>
            {' '}<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">3</kbd>
            {' '}<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">4</kbd> to rate</>
        )}
      </div>
    </div>
  );
}

```

## File: src/components/SECONDARY_FlashcardsPanel.jsx

```jsx
// FILE: src/components/SECONDARY_FlashcardsPanel.jsx
// DESCRIPTION: Complete redesign — FSRS-lite flashcard learning dashboard
//
// FIXES:
//   1. FSRS state (scheduling) stored separately from API card content
//      → refreshes never wipe review history
//   2. Retention formula fixed (unreviewed cards show "New", not 100%)
//   3. isDue() compares against current moment, not start of day
//
// NEW FEATURES:
//   • Dashboard with stats, target date, calendar, weak concepts
//   • Per-card FSRS transparency (S, D, R, lapse count)
//   • Review session with next-interval previews on rating buttons
//   • Session completion summary
//   • Target memory date with daily workload calculation
//   • 7-day upcoming review calendar (bar chart)
//   • Cards browse with algorithm stats

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════
// FSRS-LITE ALGORITHM (self-contained)
// ═══════════════════════════════════════════════════════

const FSRS = {
  BASE_GAIN: 0.18,
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 3650,
  DEFAULT_STABILITY: 3,
  DEFAULT_DIFFICULTY: 5,
  TARGET_RETENTION: 0.9,
};

/** Forgetting curve: R(t) = e^(-t/S) */
function estimateR(daysSince, stability) {
  if (!stability || stability <= 0) return 0;
  if (daysSince <= 0) return 1;
  return Math.exp(-daysSince / stability);
}

/**
 * Apply FSRS-lite update
 * qualityUI: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
function applyFSRS(card, qualityUI, targetRetention = FSRS.TARGET_RETENTION) {
  const qMap = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const quality = qMap[qualityUI] ?? qualityUI;

  const now = new Date();
  const stability = card.stability || FSRS.DEFAULT_STABILITY;
  const difficulty = card.difficulty || FSRS.DEFAULT_DIFFICULTY;
  const lapses = card.lapses || 0;
  const lastReviewedAt = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  const daysSince = lastReviewedAt ? (now - lastReviewedAt) / 86400000 : 0;

  let newS, newD, newL;

  if (quality === 0) {
    // Forgotten
    newS = Math.max(0.5, stability * 0.5);
    newD = Math.min(10, difficulty + 0.5);
    newL = lapses + 1;
  } else {
    // Recalled
    const R = estimateR(daysSince, stability);
    const qFn = (quality - 2) / 3; // Hard→1/3, Good→2/3, Easy→1
    const gain = FSRS.BASE_GAIN * qFn * (1 + (1 - R));
    newS = stability * (1 + gain);
    newD = Math.max(1, Math.min(10, difficulty - 0.05 * (quality - 3)));
    newL = lapses;
  }

  newS = Math.max(FSRS.MIN_INTERVAL, Math.min(FSRS.MAX_INTERVAL, newS));
  const intervalDays = -newS * Math.log(targetRetention);
  const nextReviewAt = new Date(now.getTime() + intervalDays * 86400000);

  return {
    ...card,
    stability: newS,
    difficulty: newD,
    lapses: newL,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    history: [...(card.history || []), { ts: now.toISOString(), quality, interval: intervalDays }],
  };
}

/** Compute preview next-interval for each rating option */
function previewIntervals(card, targetRetention = FSRS.TARGET_RETENTION) {
  const now = new Date();
  const result = {};
  [1, 2, 3, 4].forEach(q => {
    const updated = applyFSRS(card, q, targetRetention);
    const ms = new Date(updated.nextReviewAt) - now;
    const d = ms / 86400000;
    if (d < 1 / 24) result[q] = `${Math.max(1, Math.round(d * 1440))}m`;
    else if (d < 1) result[q] = `${Math.round(d * 24)}h`;
    else if (d < 7) result[q] = `${Math.round(d)}d`;
    else if (d < 30) result[q] = `${Math.round(d / 7)}w`;
    else result[q] = `${Math.round(d / 30)}mo`;
  });
  return result;
}

/** Is this card due for review right now? */
function isDue(fsrsCard) {
  if (!fsrsCard || !fsrsCard.nextReviewAt) return true;
  return new Date(fsrsCard.nextReviewAt) <= new Date();
}

/** Estimate average retention across reviewed cards. Returns null if none reviewed. */
function estimateRetention(fsrsCards) {
  const reviewed = fsrsCards.filter(c => c.lastReviewedAt && c.stability);
  if (reviewed.length === 0) return null;
  const now = new Date();
  const total = reviewed.reduce((sum, c) => {
    const days = (now - new Date(c.lastReviewedAt)) / 86400000;
    return sum + estimateR(days, c.stability);
  }, 0);
  return Math.round((total / reviewed.length) * 100);
}

// ═══════════════════════════════════════════════════════
// LOCALSTORAGE — FSRS STATE PERSISTENCE
// Key: flashcard_fsrs_v2_${chatId}
// Structure: { cards: { "setIdx_cardIdx": { ...fsrsFields } }, targetDate: string|null }
// ═══════════════════════════════════════════════════════

function fsrsKey(chatId) {
  return `flashcard_fsrs_v2_${chatId}`;
}

function loadFSRSState(chatId) {
  try {
    const raw = localStorage.getItem(fsrsKey(chatId));
    return raw ? JSON.parse(raw) : { cards: {}, targetDate: null };
  } catch {
    return { cards: {}, targetDate: null };
  }
}

function saveFSRSState(chatId, state) {
  try {
    localStorage.setItem(fsrsKey(chatId), JSON.stringify(state));
  } catch (e) {
    console.error('[Flashcards] Failed to persist FSRS state:', e);
  }
}

function cardKey(setIndex, cardIndex) {
  return `${setIndex}_${cardIndex}`;
}

function getFSRSCard(fsrsState, setIndex, cardIndex) {
  const key = cardKey(setIndex, cardIndex);
  return (
    fsrsState.cards[key] || {
      stability: FSRS.DEFAULT_STABILITY,
      difficulty: FSRS.DEFAULT_DIFFICULTY,
      lapses: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date(0).toISOString(), // epoch = always due (new card)
      history: [],
    }
  );
}

// ═══════════════════════════════════════════════════════
// SMALL UI HELPERS
// ═══════════════════════════════════════════════════════

function StatCard({ value, label, sub, colorClass = 'text-white', bgClass = 'from-gray-800 to-gray-900 border-gray-700' }) {
  return (
    <div className={`bg-gradient-to-br ${bgClass} rounded-xl border p-5`}>
      <div className={`text-4xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

function BarCalendar({ days, maxCount }) {
  const max = Math.max(maxCount, 1);
  return (
    <div className="space-y-2">
      {days.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-8 text-right text-xs font-semibold text-gray-400 flex-shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500"
              style={{ width: d.count > 0 ? `${Math.max((d.count / max) * 100, 5)}%` : '0%' }}
            />
          </div>
          <div className="w-20 text-xs flex-shrink-0">
            {d.count > 0 ? (
              <><span className="text-gray-200 font-semibold">{d.count}</span>
                <span className="text-gray-600"> cards</span></>
            ) : (
              <span className="text-gray-700">—</span>
            )}
          </div>
          <span className="text-xs text-gray-700 w-16 hidden md:inline flex-shrink-0">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function SECONDARY_FlashcardsPanel({ chatId = null, refreshTrigger = 0 }) {
  // ── API card content (question/answer text) ──────────────
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── FSRS scheduling state (persisted, never overwritten by API) ─
  const [fsrsState, setFsrsState] = useState({ cards: {}, targetDate: null });

  // ── UI state ─────────────────────────────────────────────
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'cards' | 'review'
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [targetDateInput, setTargetDateInput] = useState('');

  // ── Review session state ─────────────────────────────────
  const [reviewQueue, setReviewQueue] = useState([]); // [{ setIndex, cardIndex }]
  const [queuePos, setQueuePos] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // ── Step 1: Load card CONTENT from API (never saves scheduling here) ─
  useEffect(() => {
    if (!chatId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/secondStage/flashcards?chatId=${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setFlashcardSets(data.sets || []);
        }
      } catch (e) {
        console.error('[Flashcards] API load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chatId, refreshTrigger]);

  // ── Step 2: Load FSRS scheduling state independently from localStorage ─
  useEffect(() => {
    if (!chatId) return;
    const state = loadFSRSState(chatId);
    setFsrsState(state);
    if (state.targetDate) {
      setTargetDateInput(state.targetDate.split('T')[0]);
    }
  }, [chatId]);

  // ── Target date handler ──────────────────────────────────
  const handleSetTargetDate = useCallback(
    (dateStr) => {
      setTargetDateInput(dateStr);
      const newState = {
        ...fsrsState,
        targetDate: dateStr ? new Date(dateStr + 'T00:00:00').toISOString() : null,
      };
      setFsrsState(newState);
      saveFSRSState(chatId, newState);
    },
    [chatId, fsrsState]
  );

  // ── Start review session ──────────────────────────────────
  const handleStartReview = useCallback(
    (setIndex) => {
      const set = flashcardSets[setIndex];
      if (!set) return;
      const due = set.cards
        .map((_, cardIndex) => ({
          setIndex,
          cardIndex,
          fsrsCard: getFSRSCard(fsrsState, setIndex, cardIndex),
        }))
        .filter(item => isDue(item.fsrsCard));

      if (due.length === 0) {
        // No due cards — review all anyway (practice mode)
        const all = set.cards.map((_, cardIndex) => ({
          setIndex,
          cardIndex,
          fsrsCard: getFSRSCard(fsrsState, setIndex, cardIndex),
        }));
        setReviewQueue(all);
      } else {
        setReviewQueue(due);
      }

      setQueuePos(0);
      setIsFlipped(false);
      setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
      setReviewedCount(0);
      setShowSummary(false);
      setView('review');
    },
    [flashcardSets, fsrsState]
  );

  // ── Rate a card and persist ───────────────────────────────
  const handleRate = useCallback(
    (qualityUI) => {
      if (queuePos >= reviewQueue.length) return;
      const { setIndex, cardIndex } = reviewQueue[queuePos];
      const currentCard = getFSRSCard(fsrsState, setIndex, cardIndex);
      const updated = applyFSRS(currentCard, qualityUI);

      // Update ONLY the FSRS state — API data stays untouched
      const key = cardKey(setIndex, cardIndex);
      const newFsrsState = {
        ...fsrsState,
        cards: { ...fsrsState.cards, [key]: updated },
      };
      setFsrsState(newFsrsState);
      saveFSRSState(chatId, newFsrsState);

      const qNames = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
      setSessionStats(prev => ({ ...prev, [qNames[qualityUI]]: prev[qNames[qualityUI]] + 1 }));

      const next = queuePos + 1;
      setReviewedCount(next);
      setIsFlipped(false);

      if (next >= reviewQueue.length) {
        setShowSummary(true);
      } else {
        setQueuePos(next);
      }
    },
    [queuePos, reviewQueue, fsrsState, chatId]
  );

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    if (view !== 'review') return;
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
      if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleRate(parseInt(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, isFlipped, handleRate]);

  // ═══════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════

  const setStats = useMemo(() => {
    return flashcardSets.map((set, setIndex) => {
      const fsrsCards = set.cards.map((_, i) => getFSRSCard(fsrsState, setIndex, i));
      const dueCount = fsrsCards.filter(isDue).length;
      const retention = estimateRetention(fsrsCards);
      const avgStability =
        fsrsCards.reduce((s, c) => s + (c.stability || FSRS.DEFAULT_STABILITY), 0) / (fsrsCards.length || 1);
      const avgDifficulty =
        fsrsCards.reduce((s, c) => s + (c.difficulty || FSRS.DEFAULT_DIFFICULTY), 0) / (fsrsCards.length || 1);

      // Weak concepts: lowest stability
      const weakCards = fsrsCards
        .map((c, i) => ({ ...c, cardIndex: i }))
        .sort((a, b) => (a.stability || 0) - (b.stability || 0))
        .slice(0, 4);

      // 7-day upcoming calendar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const calDays = Array.from({ length: 7 }, (_, off) => {
        const d = new Date(today);
        d.setDate(d.getDate() + off + 1);
        const nd = new Date(d);
        nd.setDate(nd.getDate() + 1);
        const count = fsrsCards.filter(c => {
          if (!c.nextReviewAt) return false;
          const nr = new Date(c.nextReviewAt);
          return nr >= d && nr < nd;
        }).length;
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        };
      });
      const maxCalCount = Math.max(...calDays.map(d => d.count), 1);

      const reviewedToday = fsrsCards.filter(c => {
        if (!c.lastReviewedAt) return false;
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return new Date(c.lastReviewedAt) >= t;
      }).length;

      return {
        dueCount,
        retention,
        avgStability,
        avgDifficulty,
        weakCards,
        calDays,
        maxCalCount,
        total: set.cards.length,
        reviewedToday,
        fsrsCards,
      };
    });
  }, [flashcardSets, fsrsState]);

  // Global totals
  const globalStats = useMemo(() => {
    const totalCards = setStats.reduce((s, st) => s + st.total, 0);
    const totalDue = setStats.reduce((s, st) => s + st.dueCount, 0);
    const totalReviewedToday = setStats.reduce((s, st) => s + st.reviewedToday, 0);
    const allFsrsCards = setStats.flatMap(st => st.fsrsCards);
    const retention = estimateRetention(allFsrsCards);
    return { totalCards, totalDue, totalReviewedToday, retention };
  }, [setStats]);

  // Target date plan
  const targetPlan = useMemo(() => {
    if (!fsrsState.targetDate) return null;
    const target = new Date(fsrsState.targetDate);
    const now = new Date();
    const daysLeft = Math.ceil((target - now) / 86400000);
    if (daysLeft <= 0) return { daysLeft: 0, feasible: false };
    const cpd = Math.ceil(globalStats.totalDue / Math.max(daysLeft, 1));
    return { daysLeft, cardsPerDay: cpd, feasible: cpd <= 50, totalDue: globalStats.totalDue };
  }, [fsrsState.targetDate, globalStats.totalDue]);

  // ═══════════════════════════════════════════════════════
  // LOADING + EMPTY STATES
  // ═══════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto" />
          <p className="text-gray-400 text-sm">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!flashcardSets.length) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-5">🃏</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">No flashcards yet</h2>
          <p className="text-gray-400 text-sm">
            Select messages in the chat and click{' '}
            <span className="text-purple-400 font-semibold">"Generate Flashcards"</span> to create your first set.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // REVIEW MODE — Session Summary
  // ═══════════════════════════════════════════════════════

  if (view === 'review' && showSummary) {
    const total = reviewQueue.length;
    const correct = sessionStats.good + sessionStats.easy;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-6xl animate-bounce">🎉</div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-100">Session Complete!</h2>
          <p className="text-gray-400 mt-1">Cards are scheduled for future review</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-xl">
          {[
            { label: 'Reviewed', value: total, color: 'text-white', bg: 'from-gray-800 to-gray-900 border-gray-700' },
            { label: 'Correct Rate', value: `${pct}%`, color: 'text-green-300', bg: 'from-green-900/20 to-emerald-900/20 border-green-700/50' },
            { label: 'Good/Easy', value: correct, color: 'text-blue-300', bg: 'from-blue-900/20 to-indigo-900/20 border-blue-700/50' },
            { label: 'Again', value: sessionStats.again, color: 'text-red-300', bg: 'from-red-900/20 to-red-900/20 border-red-700/50' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} border rounded-xl p-4 text-center`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-5 text-sm">
          {[
            { l: 'Again', v: sessionStats.again, c: 'bg-red-500' },
            { l: 'Hard', v: sessionStats.hard, c: 'bg-orange-500' },
            { l: 'Good', v: sessionStats.good, c: 'bg-green-500' },
            { l: 'Easy', v: sessionStats.easy, c: 'bg-blue-500' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5 text-gray-400">
              <div className={`w-2.5 h-2.5 rounded-full ${s.c}`} />
              {s.l}: <span className="text-gray-200 font-semibold ml-0.5">{s.v}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setView('dashboard')}
          className="px-10 py-3 bg-gradient-to-r from-purple-700 to-violet-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity text-base"
        >
          Back to Dashboard →
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // REVIEW MODE — Active Card
  // ═══════════════════════════════════════════════════════

  if (view === 'review' && reviewQueue.length > 0) {
    const { setIndex, cardIndex } = reviewQueue[queuePos];
    const apiCard = flashcardSets[setIndex]?.cards[cardIndex];
    const fsrsCard = getFSRSCard(fsrsState, setIndex, cardIndex);
    const intervals = previewIntervals(fsrsCard);
    const progress = (reviewedCount / reviewQueue.length) * 100;

    const ratingBtns = [
      { ui: 1, label: 'Again', key: '1', border: 'border-red-600 hover:bg-red-950/50', text: 'text-red-400', itext: 'text-red-300' },
      { ui: 2, label: 'Hard', key: '2', border: 'border-orange-600 hover:bg-orange-950/50', text: 'text-orange-400', itext: 'text-orange-300' },
      { ui: 3, label: 'Good', key: '3', border: 'border-green-600 hover:bg-green-950/50', text: 'text-green-400', itext: 'text-green-300' },
      { ui: 4, label: 'Easy', key: '4', border: 'border-blue-600 hover:bg-blue-950/50', text: 'text-blue-400', itext: 'text-blue-300' },
    ];

    return (
      <div className="flex flex-col h-full gap-4 p-6 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Review Session</h2>
            <p className="text-xs text-gray-400">
              Card{' '}
              <span className="font-semibold text-gray-200">{reviewedCount + 1}</span>{' '}
              of{' '}
              <span className="font-semibold text-gray-200">{reviewQueue.length}</span>
            </p>
          </div>
          <div className="flex gap-3 text-xs text-center">
            {[
              { l: 'Easy', v: sessionStats.easy, c: 'text-blue-400' },
              { l: 'Good', v: sessionStats.good, c: 'text-green-400' },
              { l: 'Hard', v: sessionStats.hard, c: 'text-orange-400' },
              { l: 'Again', v: sessionStats.again, c: 'text-red-400' },
            ].map(s => (
              <div key={s.l}>
                <div className={`font-bold ${s.c}`}>{s.v}</div>
                <div className="text-gray-600">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flip card */}
        <div
          onClick={() => setIsFlipped(f => !f)}
          className="flex-1 cursor-pointer"
          style={{ perspective: '1000px', minHeight: '180px', maxHeight: '240px' }}
        >
          <div
            className="w-full h-full relative transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-violet-900/20 p-8"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Question</div>
              <div className="text-xl font-medium text-white leading-relaxed">{apiCard?.q}</div>
              <div className="text-xs text-gray-500 mt-6 italic">Click or <kbd className="px-1 bg-gray-800/50 rounded">Space</kbd> to reveal</div>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-900/30 to-green-900/20 p-8"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Answer</div>
              <div className="text-xl font-medium text-white leading-relaxed">{apiCard?.a}</div>
            </div>
          </div>
        </div>

        {/* FSRS stats row */}
        <div className="grid grid-cols-4 gap-2 text-xs text-center bg-gray-900/60 rounded-xl p-3 border border-gray-800">
          {[
            { label: 'Stability', value: `${(fsrsCard.stability || FSRS.DEFAULT_STABILITY).toFixed(1)}d` },
            { label: 'Difficulty', value: (fsrsCard.difficulty || FSRS.DEFAULT_DIFFICULTY).toFixed(1) },
            { label: 'Lapses', value: fsrsCard.lapses || 0 },
            { label: 'Reviews', value: (fsrsCard.history || []).length },
          ].map(s => (
            <div key={s.label}>
              <div className="text-gray-200 font-semibold">{s.value}</div>
              <div className="text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rating buttons with interval preview */}
        <div className={`grid grid-cols-4 gap-3 transition-opacity duration-200 ${isFlipped ? 'opacity-100' : 'opacity-25 pointer-events-none'}`}>
          {ratingBtns.map(btn => (
            <button
              key={btn.ui}
              onClick={(e) => { e.stopPropagation(); if (isFlipped) handleRate(btn.ui); }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-transparent transition-all hover:scale-105 active:scale-95 ${btn.border} ${btn.text}`}
            >
              <span className="text-xs opacity-40">{btn.key}</span>
              <span className="text-sm font-bold">{btn.label}</span>
              <span className={`text-xs font-semibold ${btn.itext}`}>{intervals[btn.ui]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setView('dashboard')}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← End session
          </button>
          <span className="text-xs text-gray-700">
            💡 <kbd className="px-1 bg-gray-800 rounded text-gray-500">Space</kbd> flip
            {isFlipped && <> | <kbd className="px-1 bg-gray-800 rounded text-gray-500">1</kbd>–<kbd className="px-1 bg-gray-800 rounded text-gray-500">4</kbd> rate</>}
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // CARDS BROWSE VIEW
  // ═══════════════════════════════════════════════════════

  if (view === 'cards') {
    const set = flashcardSets[activeSetIndex];
    const st = setStats[activeSetIndex];
    if (!set) { setView('dashboard'); return null; }

    return (
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900/40">
          <button
            onClick={() => setView('dashboard')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Dashboard
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-300 font-semibold">
            Set {activeSetIndex + 1} — {set.cards.length} cards
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleStartReview(activeSetIndex)}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-700 to-violet-600 rounded-lg text-sm text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Review {st.dueCount > 0 ? `(${st.dueCount} due)` : 'all'}
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {set.cards.map((card, cardIndex) => {
              const fc = getFSRSCard(fsrsState, activeSetIndex, cardIndex);
              const due = isDue(fc);
              const now = new Date();
              const days = fc.lastReviewedAt ? (now - new Date(fc.lastReviewedAt)) / 86400000 : null;
              const R = days !== null && fc.stability ? estimateR(days, fc.stability) : null;
              const expanded = expandedCard === `${activeSetIndex}_${cardIndex}`;

              return (
                <div
                  key={cardIndex}
                  className={`rounded-xl border overflow-hidden transition-colors ${due ? 'border-orange-700/40 bg-orange-900/10' : 'border-gray-700/60 bg-gray-900/40'}`}
                >
                  <button
                    onClick={() => setExpandedCard(expanded ? null : `${activeSetIndex}_${cardIndex}`)}
                    className="w-full p-4 text-left hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Q</div>
                        <div className="text-gray-100 text-sm line-clamp-2">{card.q}</div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {due && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 border border-orange-700/50">
                            Due
                          </span>
                        )}
                        {R !== null && (
                          <span className="text-xs text-gray-500">{Math.round(R * 100)}% recall</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-800/60">
                      <div className="text-xs text-gray-500 mt-3 mb-1">A</div>
                      <div className="text-gray-200 text-sm mb-4">{card.a}</div>

                      {/* FSRS algorithm transparency */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Memory Stability', value: `${(fc.stability || FSRS.DEFAULT_STABILITY).toFixed(2)} days` },
                          { label: 'Difficulty', value: `${(fc.difficulty || FSRS.DEFAULT_DIFFICULTY).toFixed(2)} / 10` },
                          { label: 'Recall Probability', value: R !== null ? `${Math.round(R * 100)}%` : 'No data' },
                          { label: 'Lapses', value: fc.lapses || 0 },
                          { label: 'Total Reviews', value: (fc.history || []).length },
                          {
                            label: 'Next Review',
                            value: fc.nextReviewAt
                              ? new Date(fc.nextReviewAt) <= new Date()
                                ? 'Now'
                                : new Date(fc.nextReviewAt).toLocaleDateString()
                              : 'Now',
                          },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-800/60 rounded-lg p-2.5">
                            <div className="text-gray-500 mb-0.5">{item.label}</div>
                            <div className="text-gray-200 font-semibold">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {card.tags.map((tag, ti) => (
                            <span key={ti} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // DASHBOARD VIEW
  // ═══════════════════════════════════════════════════════

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Flashcard Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ── Global Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={globalStats.totalCards} label="Total Cards" bgClass="from-gray-800 to-gray-900 border-gray-700" />
          <StatCard
            value={globalStats.retention !== null ? `${globalStats.retention}%` : 'New'}
            label="Avg Retention"
            colorClass="text-green-300"
            bgClass="from-green-900/20 to-emerald-900/20 border-green-700/40"
            sub={globalStats.retention !== null ? undefined : 'Start reviewing to track'}
          />
          <StatCard
            value={globalStats.totalDue}
            label="Due Now"
            colorClass="text-orange-300"
            bgClass="from-orange-900/20 to-red-900/20 border-orange-700/40"
            sub={`~${Math.max(1, Math.ceil(globalStats.totalDue * 1.5))} min`}
          />
          <StatCard
            value={globalStats.totalReviewedToday}
            label="Reviewed Today"
            colorClass="text-purple-300"
            bgClass="from-purple-900/20 to-violet-900/20 border-purple-700/40"
            sub={globalStats.totalReviewedToday > 0 ? '✓ Keep it up!' : undefined}
          />
        </div>

        {/* ── Target Memory Date ── */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="font-semibold text-gray-200 mb-1">🎯 Target Memory Date</h3>
          <p className="text-xs text-gray-500 mb-4">
            Set a deadline — the system estimates daily study load to reach your goal
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="date"
              value={targetDateInput}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => handleSetTargetDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            {targetPlan ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-purple-300">{targetPlan.daysLeft}</span>
                  <span className="text-sm text-gray-400">days left</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${targetPlan.feasible ? 'text-green-300' : 'text-red-300'}`}>
                    {targetPlan.cardsPerDay}
                  </span>
                  <span className="text-sm text-gray-400">cards/day needed</span>
                </div>
                {!targetPlan.feasible && (
                  <span className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-1.5">
                    ⚠ Heavy workload — consider extending the deadline
                  </span>
                )}
                {targetPlan.feasible && (
                  <span className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-1.5">
                    ✓ Feasible study plan
                  </span>
                )}
                <button
                  onClick={() => handleSetTargetDate('')}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-600 italic">
                Select a date to see your study plan
              </span>
            )}
          </div>
        </div>

        {/* ── Per-set sections ── */}
        {flashcardSets.map((set, setIndex) => {
          const st = setStats[setIndex];
          return (
            <div key={setIndex} className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
              {/* Set header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-gray-900/60">
                <div>
                  <h3 className="font-semibold text-gray-200">Flashcard Set {setIndex + 1}</h3>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{st.total} cards</span>
                    <span>·</span>
                    <span className={st.dueCount > 0 ? 'text-orange-400 font-semibold' : 'text-gray-600'}>
                      {st.dueCount} due now
                    </span>
                    <span>·</span>
                    <span>
                      {st.retention !== null ? (
                        <span className="text-green-400">{st.retention}% retention</span>
                      ) : (
                        <span className="text-gray-600">Not yet reviewed</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveSetIndex(setIndex); setView('cards'); }}
                    className="px-3 py-1.5 text-xs text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors"
                  >
                    Browse Cards
                  </button>
                  <button
                    onClick={() => handleStartReview(setIndex)}
                    className="px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {st.dueCount > 0 ? `Review (${st.dueCount})` : 'Practice All'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">

                {/* Upcoming Reviews Calendar */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">📅 Upcoming Reviews — Next 7 Days</h4>
                  <p className="text-xs text-gray-600 mb-4">Scheduled review workload</p>
                  {st.calDays.every(d => d.count === 0) ? (
                    <div className="text-center text-gray-700 text-xs py-6">
                      Review cards to generate a schedule
                    </div>
                  ) : (
                    <BarCalendar days={st.calDays} maxCount={st.maxCalCount} />
                  )}
                </div>

                {/* Weak Concepts */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">🔥 Weak Concepts</h4>
                  <p className="text-xs text-gray-600 mb-4">Lowest memory stability — prioritize these</p>
                  {st.weakCards.length === 0 ? (
                    <div className="text-center text-gray-700 text-xs py-6">No cards yet</div>
                  ) : (
                    <div className="space-y-2.5">
                      {st.weakCards.map(wc => {
                        const apiCard = set.cards[wc.cardIndex];
                        const stabilityPct = Math.min((wc.stability || 0) / 14, 1) * 100;

                        return (
                          <div key={wc.cardIndex} className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="text-sm text-gray-200 line-clamp-1 flex-1">{apiCard?.q}</div>
                              <span className="text-xs bg-gray-700 text-gray-300 rounded px-1.5 py-0.5 flex-shrink-0">
                                {(wc.stability || FSRS.DEFAULT_STABILITY).toFixed(1)}d
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(wc.stability || 0) < 2 ? 'bg-red-500' :
                                      (wc.stability || 0) < 5 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.max(stabilityPct, 3)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 flex-shrink-0">
                                {wc.lastReviewedAt
                                  ? `Last: ${new Date(wc.lastReviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                  : 'Never reviewed'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Set analytics */}
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-800/60">
                  {[
                    { label: 'Avg Stability', value: `${st.avgStability.toFixed(1)}d` },
                    { label: 'Avg Difficulty', value: `${st.avgDifficulty.toFixed(1)}/10` },
                    { label: 'Reviewed Today', value: st.reviewedToday },
                    {
                      label: 'Study Time Est.',
                      value: `~${Math.max(1, Math.ceil(st.dueCount * 1.5))}m`,
                    },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800/40 rounded-lg p-3 text-center">
                      <div className="text-base font-bold text-gray-200">{item.value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

```

## File: src/lib/config/flashcardsConfig.js

```javascript
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

```

## File: src/lib/flashcardMigration.js

```javascript
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

```

## File: src/lib/helpers/flashcardHelpers.js

```javascript
/**
 * FILE: src/lib/helpers/flashcardHelpers.js
 * DESCRIPTION: FSRS-lite algorithm implementation and flashcard utilities
 * 
 * FSRS-lite is a practical, deterministic spaced repetition scheduler based on FSRS v3.
 * Full spec: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
 * 
 * Core concepts:
 *   - Difficulty (D): how hard the material is (1-10 scale)
 *   - Stability (S): memory trace strength (in days)
 *   - Retrievability (R): estimated recall probability (0-1)
 *   - R(t) = exp(-t / S): exponential decay
 *   - targetRetention: desired recall rate (default 0.9 = 90%)
 * 
 * This implementation is upgradeable to full FSRS v4 by swapping scheduler functions.
 */

/**
 * Estimate current recall probability based on days since last review
 * 
 * @param {number} daysSince - days since last review (fractional OK)
 * @param {number} stability - current stability in days
 * @returns {number} estimated retrievability (0-1)
 */
export function estimateR(daysSince, stability) {
  if (stability <= 0 || daysSince < 0) return 0;
  return Math.exp(-daysSince / stability);
}

/**
 * Apply FSRS-lite review update rules
 * 
 * @param {Object} card - card object with current S, D, lapses, lastReviewedAt
 * @param {number} quality - user rating: 0 (Again) | 3 (Hard) | 4 (Good) | 5 (Easy)
 * @param {Date|string} now - current timestamp
 * @param {number} targetRetention - desired recall rate (default 0.9)
 * @returns {Object} updated card with new S, D, lapses, lastReviewedAt, nextReviewAt, history entry
 * 
 * Algorithm:
 *   1. If forgotten (q <= 2):
 *      - S_new = max(0.5, S_old * 0.5)
 *      - D_new = D_old + 0.5
 *      - lapses++
 *   2. Else (q >= 3, successful):
 *      - gain = baseGain * f(q) * (1 + (1 - R))
 *        where f(q) = (q - 2) / 3
 *      - S_new = S_old * (1 + gain)
 *      - D_new = clamp(D_old - 0.05 * (q - 3), 1, 10)
 *   3. Compute next interval: t_next = -S_new * ln(targetRetention)
 *   4. Clamp interval to [minInterval, maxInterval]
 *   5. Persist history record with ts, quality, interval
 */
export function applyReviewUpdate(card, quality, now, targetRetention = 0.9) {
  const timestamp = new Date(now);

  // Get previous stability or use default
  let stability = card.stability || 3;
  let difficulty = card.difficulty || 5;
  let lapses = card.lapses || 0;

  // Calculate days since last review
  const lastReviewedAt = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  let daysSince = 0;
  if (lastReviewedAt && lastReviewedAt < timestamp) {
    daysSince = (timestamp - lastReviewedAt) / (1000 * 60 * 60 * 24);
  }

  // Constants (tunable)
  const BASE_GAIN = 0.18;
  const MIN_INTERVAL = 1;
  const MAX_INTERVAL = 3650; // 10 years

  let stabilityNew = stability;
  let difficultyNew = difficulty;
  let lapsesNew = lapses;

  if (quality <= 2) {
    // Forgotten card
    stabilityNew = Math.max(0.5, stability * 0.5);
    difficultyNew = difficulty + 0.5;
    lapsesNew = lapses + 1;
  } else {
    // Successful recall
    const R = estimateR(daysSince, stability);
    const qualityFn = (quality - 2) / 3; // Hard(3)→1/3, Good(4)→2/3, Easy(5)→1
    const gain = BASE_GAIN * qualityFn * (1 + (1 - R));

    stabilityNew = stability * (1 + gain);
    difficultyNew = Math.max(1, Math.min(10, difficulty - 0.05 * (quality - 3)));
  }

  // Clamp difficulty
  difficultyNew = Math.max(1, Math.min(10, difficultyNew));

  // Schedule next review: solve exp(-t / S) = targetRetention
  // => t = -S * ln(targetRetention)
  let intervalDays = -stabilityNew * Math.log(targetRetention);
  intervalDays = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, intervalDays));

  // Calculate next review date
  const nextReviewAt = new Date(timestamp);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  // Build history record
  const historyEntry = {
    ts: timestamp.toISOString(),
    quality,
    interval: daysSince, // interval that just ended
  };

  // Update card
  const updatedCard = {
    ...card,
    stability: stabilityNew,
    difficulty: difficultyNew,
    lapses: lapsesNew,
    lastReviewedAt: timestamp.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    history: [...(card.history || []), historyEntry],
  };

  return updatedCard;
}

/**
 * Get cards that are due for review today
 * 
 * @param {Array} cards - array of card objects
 * @param {Date|string} today - reference date (default today)
 * @returns {Array} cards due for review, sorted by nextReviewAt
 */
export function getDueCards(cards, now = new Date()) {
  // Use current moment: cards are due when nextReviewAt <= now
  // This ensures reviewed cards (rescheduled into the future) disappear immediately
  const refDate = new Date(now);

  return cards.filter(card => {
    if (!card.nextReviewAt) return true; // Never reviewed → always due
    const nextReview = new Date(card.nextReviewAt);
    return nextReview <= refDate;
  }).sort((a, b) => {
    const aDate = a.nextReviewAt ? new Date(a.nextReviewAt) : new Date(0);
    const bDate = b.nextReviewAt ? new Date(b.nextReviewAt) : new Date(0);
    return aDate - bDate;
  });
}

/**
 * Get cards due in the next N days
 * 
 * @param {Array} cards - array of card objects
 * @param {number} daysAhead - number of days to look ahead
 * @param {Date|string} fromDate - start date (default today)
 * @returns {Array} cards due within daysAhead
 */
export function getUpcomingCards(cards, daysAhead = 7, fromDate = new Date()) {
  const refDate = new Date(fromDate);
  refDate.setHours(0, 0, 0, 0);

  const endDate = new Date(refDate);
  endDate.setDate(endDate.getDate() + daysAhead);

  return cards.filter(card => {
    if (!card.nextReviewAt) return false;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview > refDate && nextReview <= endDate;
  }).sort((a, b) => {
    const aDate = new Date(a.nextReviewAt);
    const bDate = new Date(b.nextReviewAt);
    return aDate - bDate;
  });
}

/**
 * Compute collection-wide retention estimate
 * Average of current R values across all cards
 * 
 * @param {Array} cards - array of card objects
 * @param {Date|string} today - reference date
 * @returns {number} average retrievability (0-1)
 */
export function estimateCollectionRetention(cards, today = new Date()) {
  if (!cards || cards.length === 0) return 0;

  const refDate = new Date(today);

  const retrievabilities = cards.map(card => {
    const lastReview = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
    if (!lastReview || !card.stability) return 1; // Never reviewed, assume stable

    const daysSince = (refDate - lastReview) / (1000 * 60 * 60 * 24);
    return estimateR(daysSince, card.stability);
  });

  const avg = retrievabilities.reduce((a, b) => a + b, 0) / retrievabilities.length;
  return Math.round(avg * 10000) / 10000;
}

/**
 * Find lowest-stability cards in a collection (priority study items)
 * 
 * @param {Array} cards - array of cards
 * @param {number} limit - max cards to return
 * @returns {Array} cards sorted by stability (ascending)
 */
export function getLowStabilityCards(cards, limit = 5) {
  return cards
    .slice()
    .sort((a, b) => {
      const stabilityA = a.stability || 0;
      const stabilityB = b.stability || 0;
      return stabilityA - stabilityB;
    })
    .slice(0, limit);
}

/**
 * Migrate card if missing FSRS fields
 * Populate defaults and estimate S from history if available
 * 
 * @param {Object} card - card object (may lack S, D, history)
 * @param {number} defaultStability - default S if no history (default 3)
 * @param {number} defaultDifficulty - default D (default 5)
 * @returns {Object} migrated card with all required fields
 */
export function migrateCard(card, defaultStability = 3, defaultDifficulty = 5) {
  const migrated = { ...card };

  // Ensure all fields exist
  if (!migrated.id) migrated.id = `card_${Date.now()}_${Math.random()}`;
  if (!migrated.front) migrated.front = '';
  if (!migrated.back) migrated.back = '';
  if (!migrated.tags) migrated.tags = [];
  if (!migrated.history) migrated.history = [];
  if (!migrated.lapses) migrated.lapses = 0;

  // Estimate or set stability
  if (!migrated.stability || migrated.stability <= 0) {
    if (migrated.history && migrated.history.length > 1) {
      // Estimate from last two reviews
      const hist = migrated.history.slice(-2);
      if (hist.length === 2) {
        const t1 = new Date(hist[0].ts);
        const t2 = new Date(hist[1].ts);
        const estimatedInterval = (t2 - t1) / (1000 * 60 * 60 * 24);
        migrated.stability = Math.max(0.5, estimatedInterval);
      } else {
        migrated.stability = defaultStability;
      }
    } else {
      migrated.stability = defaultStability;
    }
  }

  // Set difficulty
  if (!migrated.difficulty || migrated.difficulty < 1 || migrated.difficulty > 10) {
    migrated.difficulty = defaultDifficulty;
  }

  // Set review timestamps if missing
  if (!migrated.lastReviewedAt && migrated.history && migrated.history.length > 0) {
    migrated.lastReviewedAt = migrated.history[migrated.history.length - 1].ts;
  }

  if (!migrated.nextReviewAt) {
    // If no next review scheduled, assume due now
    migrated.nextReviewAt = new Date(0).toISOString();
  }

  return migrated;
}

/**
 * Simulate FSRS-lite behavior on an example card for educational purposes
 * Returns a walkthrough of two reviews
 * 
 * @returns {Object} { initial, review1, review2, explanation }
 */
export function simulateExample() {
  const initialCard = {
    id: 'example_card_1',
    front: 'What is the capital of France?',
    back: 'Paris',
    tags: ['geography'],
    history: [],
    stability: 3,
    difficulty: 5,
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
  };

  // First review: user rates "Good" (quality 4)
  const review1Date = new Date();
  const afterReview1 = applyReviewUpdate(initialCard, 4, review1Date, 0.9);

  // Second review: 7 days later, user rates "Easy" (quality 5)
  const review2Date = new Date(review1Date);
  review2Date.setDate(review2Date.getDate() + 7);
  const afterReview2 = applyReviewUpdate(afterReview1, 5, review2Date, 0.9);

  return {
    initial: initialCard,
    review1: {
      date: review1Date.toISOString(),
      quality: 4,
      rating: 'Good',
      result: afterReview1,
      explanation: 'User rated "Good". Stability increased, next interval ~6 days.',
    },
    review2: {
      date: review2Date.toISOString(),
      quality: 5,
      rating: 'Easy',
      result: afterReview2,
      explanation: 'User rated "Easy" 7 days later. Stability increased more, next interval ~35 days.',
    },
  };
}

/**
 * Calculate daily review stats for a collection
 * 
 * @param {Array} cards - array of cards
 * @param {Date|string} today - reference date
 * @returns {Object} { dueTodayCount, upcomingCount, reviewedTodayCount, totalCards }
 */
export function getDailyStats(cards, today = new Date()) {
  if (!cards || cards.length === 0) {
    return { dueTodayCount: 0, upcomingCount: 0, reviewedTodayCount: 0, totalCards: 0 };
  }

  const refDate = new Date(today);
  refDate.setHours(0, 0, 0, 0);

  const endOfToday = new Date(refDate);
  endOfToday.setHours(23, 59, 59, 999);

  const dueTodayCount = cards.filter(card => {
    if (!card.nextReviewAt) return true;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview <= endOfToday;
  }).length;

  const upcomingCount = cards.filter(card => {
    if (!card.nextReviewAt) return false;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview > endOfToday && nextReview <= new Date(refDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;

  const reviewedTodayCount = cards.filter(card => {
    if (!card.lastReviewedAt) return false;
    const lastReview = new Date(card.lastReviewedAt);
    return lastReview >= refDate && lastReview <= endOfToday;
  }).length;

  return {
    dueTodayCount,
    upcomingCount,
    reviewedTodayCount,
    totalCards: cards.length,
  };
}

/**
 * Format interval in human-readable form
 * 
 * @param {number} days - number of days
 * @returns {string} e.g., "3d", "4w", "2mo"
 */
export function formatInterval(days) {
  if (days < 1) return '< 1d';
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

/**
 * Export cards to Anki format (.apkg compatible CSV)
 * 
 * @param {Array} cards - cards to export
 * @param {string} deckName - name for Anki deck
 * @returns {string} CSV content
 */
export function exportToAnkiCSV(cards, deckName = 'Exported Deck') {
  const headers = ['#notetype:Basic', '#deck:' + deckName];
  const rows = cards.map(card => {
    const front = (card.front || '').replace(/\n/g, '<br>').replace(/"/g, '""');
    const back = (card.back || '').replace(/\n/g, '<br>').replace(/"/g, '""');
    const tags = (card.tags || []).join(' ');
    return `"${front}"	"${back}"	${tags}`;
  });

  return [...headers, ...rows].join('\n');
}

/**
 * Export cards to JSON format
 * 
 * @param {Array} cards - cards to export
 * @returns {string} JSON string
 */
export function exportToJSON(cards) {
  return JSON.stringify(cards, null, 2);
}

```

## File: src/app/api/secondStage/flashcards/route.js

```javascript
// FILE: src/app/api/secondStage/flashcards/route.js
// DESCRIPTION: Flashcard generation endpoint; generates Q&A cards from selected messages

import { callProvider } from '@/lib/SECONDARY_providers';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { saveFlashcards, getFlashcards, getMessageHistory } from '@/lib/SECONDARY_db';

/**
 * POST /api/secondStage/flashcards
 * 
 * Request body:
 *   {
 *     chatId: string,
 *     messageIds: string[],
 *     provider: string (optional, defaults to "openai"),
 *     apiKey: string (optional)
 *   }
 * 
 * Response:
 *   {
 *     cards: [
 *       { q: "Question?", a: "Answer", difficulty: "easy|medium|hard", tags: ["tag1", "tag2"] },
 *       ...
 *     ],
 *     chatId: string,
 *     messageCount: number,
 *     savedId: string (if authenticated)
 *   }
 * 
 * Data flow:
 *   1. Validate input (chatId, messageIds)
 *   2. Fetch actual messages from DB (placeholder here)
 *   3. Call provider with JSON prompt requesting flashcard array
 *   4. Parse JSON response, validate structure
 *   5. Save to DB (if authenticated)
 *   6. Return cards array
 */
export async function POST(req) {
  try {
    // Parse the request body
    let body = {};
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      chatId,
      messageIds = [],
      provider = 'openai',
      apiKey,
    } = body;

    // Validate input
    if (!chatId || !messageIds || messageIds.length === 0) {
      return Response.json(
        { error: 'Missing required fields: chatId, messageIds' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserIfAuthenticated(req);

    // Determine which provider to use - default to huggingface if no provider specified and no api key
    let providerToUse = provider;
    if (!apiKey && provider === 'openai' && !process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found, switching to HuggingFace');
      providerToUse = 'huggingface';
    }

    // Fetch actual message content from database
    let messageContent = '';
    try {
      if (user) {
        const messages = await getMessageHistory({ userId: user.id, chatId });
        // Filter to only selected messages and extract content
        const selectedMessages = messages.filter((msg) =>
          messageIds.includes(msg._id?.toString() || msg._id) || messageIds.includes(`msg_${msg.sequenceNumber}`)
        );
        messageContent = selectedMessages.map((msg) => msg.content).join('\n\n');
      }

      // Fallback if no messages found
      if (!messageContent) {
        messageContent = 'No message content available';
      }
    } catch (err) {
      console.error('Error fetching message history:', err);
      messageContent = 'Unable to retrieve message content';
    }

    const systemPrompt =
      'You are an expert tutor. Generate flashcards in JSON array format. Each card: {q: "question", a: "answer", difficulty: "easy|medium|hard", tags: ["tag1", "tag2"]}. Respond ONLY with JSON array, no markdown.';

    const userPrompt = `Generate 5 flashcards from this content:\n\n${messageContent}\n\nReturn ONLY a JSON array of flashcards. Example: [{"q": "What is X?", "a": "X is Y", "difficulty": "easy", "tags": ["topic"]}]`;

    // Call provider
    const flashcardsResponse = await callProvider({
      provider: providerToUse,
      apiKey,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      stream: false,
      systemPrompt,
    });

    // Parse JSON response
    let cards = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = flashcardsResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
      } else {
        cards = JSON.parse(flashcardsResponse);
      }

      // Validate card structure
      if (!Array.isArray(cards)) {
        throw new Error('Response is not an array');
      }

      cards = cards.filter(
        (card) =>
          card.q && card.a && typeof card.q === 'string' && typeof card.a === 'string'
      );
    } catch (parseError) {
      console.error('JSON parse error in flashcards:', parseError);
      return Response.json(
        { error: 'Failed to parse LLM response as JSON flashcard array' },
        { status: 400 }
      );
    }

    // Save to DB if authenticated
    let savedId = null;
    if (user) {
      try {
        const result = await saveFlashcards({
          userId: user.id,
          chatId,
          messageIds,
          cards,
        });
        savedId = result._id?.toString();

        // Background: add each card to the RAG vector store (non-blocking)
        try {
          const { addToVectorStore } = await import('@/lib/rag/index.js');
          const { getChat } = await import('@/lib/SECONDARY_db');

          // Determine category (collection)
          let category = 'unknown';
          try {
            const chat = await getChat({ userId: user.id, chatId });
            if (chat && chat.collection) {
              category = chat.collection;
            }
          } catch (err) {
            // ignore
          }

          cards.forEach((card, idx) => {
            const sourceId = `${savedId}:${idx}`;
            const text = `Q: ${card.q}\nA: ${card.a}`;

            // Fire and forget; log failures but do not affect response
            addToVectorStore({
              userId: user.id,
              sourceType: 'flashcard',
              sourceId,
              text,
              metadata: {
                difficulty: card.difficulty || 'unknown',
                tags: card.tags || [],
                category: category
              },
            }).then((res) => {
              if (!res.success) {
                console.warn('addToVectorStore failed for', sourceId, res.error);
              } else {
                console.log('addToVectorStore succeeded for', sourceId, 'category', category);
              }
            }).catch((err) => {
              console.warn('addToVectorStore error for', sourceId, err?.message || err);
            });
          });
        } catch (err) {
          console.warn('Failed to enqueue embeddings for flashcards:', err?.message || err);
        }
      } catch (dbError) {
        console.error('Error saving flashcards to DB:', dbError);
      }
    }

    return Response.json({
      cards,
      chatId,
      messageCount: messageIds.length,
      savedId,
      provider,
    });
  } catch (error) {
    console.error('Flashcards API error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/secondStage/flashcards
 * Retrieve flashcard sets for a chat
 * Query params: chatId
 * Returns: { sets: [...] }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return Response.json(
        { error: 'Missing chatId parameter' },
        { status: 400 }
      );
    }

    const user = await getUserIfAuthenticated(req);

    if (!user) {
      // Anonymous: return empty
      return Response.json({ sets: [] });
    }

    const sets = await getFlashcards({
      userId: user.id,
      chatId,
    });

    return Response.json({
      sets: sets.map((set) => ({
        ...set,
        _id: set._id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Flashcards GET error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

```

