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
