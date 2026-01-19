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
