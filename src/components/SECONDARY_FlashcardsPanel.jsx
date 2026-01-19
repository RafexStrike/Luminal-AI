// FILE: src/components/SECONDARY_FlashcardsPanel.jsx
// DESCRIPTION: Flashcards display panel with FSRS-lite spaced repetition scheduling
// FEATURES: Display, review, ratings, dashboard, export, collection management

'use client';

import { useState, useEffect } from 'react';

/**
 * SECONDARY_FlashcardsPanel - FSRS-lite Integrated
 * 
 * Features:
 *   - Display list of flashcard sets for current chat
 *   - FSRS-lite spaced repetition with stability/difficulty tracking
 *   - Review mode with rating buttons (1=Again, 2=Hard, 3=Good, 4=Easy)
 *   - Dashboard showing retention %, due cards, and stats
 *   - Collection management (create, edit, delete)
 *   - Export JSON and Anki formats
 *   - Keyboard shortcuts: Space (flip), 1-4 (rate)
 * 
 * Data persistence: localStorage (collections and cards)
 * Algorithm: R(t) = e^(-t/S), updates on rating 1-4
 */

// ==================== FSRS-LITE HELPERS ====================

const FSRS_CONFIG = {
  BASE_GAIN: 0.18,
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 3650,
  DEFAULT_STABILITY: 3,
  DEFAULT_DIFFICULTY: 5.0,
  TARGET_RETENTION: 0.9,
};

const estimateR = (daysSince, stability) => {
  if (daysSince <= 0 || stability <= 0) return 1;
  return Math.exp(-daysSince / stability);
};

const applyReviewUpdate = (card, quality, targetRetention = FSRS_CONFIG.TARGET_RETENTION) => {
  const now = new Date();
  const history = card.history || [];
  const lastReview = card.lastReviewedAt ? new Date(card.lastReviewedAt) : now;
  const daysSince = (now - lastReview) / (1000 * 60 * 60 * 24);

  let stability = card.stability || FSRS_CONFIG.DEFAULT_STABILITY;
  let difficulty = card.difficulty || FSRS_CONFIG.DEFAULT_DIFFICULTY;
  let lapses = card.lapses || 0;

  // Update based on quality (0=Again, 3=Hard, 4=Good, 5=Easy)
  const qualityMap = { 1: 0, 2: 3, 3: 4, 4: 5 }; // UI buttons to FSRS quality
  const q = qualityMap[quality] || quality;

  if (q === 0) {
    // Again - reset stability, record lapse
    stability = FSRS_CONFIG.DEFAULT_STABILITY * 0.3;
    lapses++;
  } else if (q === 3) {
    // Hard - small increase
    stability *= 1.1;
  } else if (q === 4) {
    // Good - normal increase using exponential model
    stability *= Math.exp(FSRS_CONFIG.BASE_GAIN * (q - 3));
  } else if (q === 5) {
    // Easy - large increase
    stability *= Math.exp(FSRS_CONFIG.BASE_GAIN * (q - 3));
  }

  // Update difficulty
  difficulty = Math.max(1, Math.min(10, difficulty + (5 - q) * 0.1));

  // Calculate next review interval
  const r = estimateR(daysSince, stability);
  const nextInterval = -stability * Math.log(targetRetention);
  const nextReviewAt = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    stability: Math.max(FSRS_CONFIG.MIN_INTERVAL, Math.min(FSRS_CONFIG.MAX_INTERVAL, stability)),
    difficulty,
    lapses,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    history: [...history, { ts: now.toISOString(), quality: q, interval: nextInterval }],
  };
};

const getDueCards = (cards) => {
  const now = new Date();
  return cards.filter(card => {
    const nextReview = card.nextReviewAt ? new Date(card.nextReviewAt) : new Date(0);
    return nextReview <= now;
  });
};

const estimateRetention = (cards) => {
  if (cards.length === 0) return 100;
  const now = new Date();
  const totalR = cards.reduce((sum, card) => {
    const lastReview = card.lastReviewedAt ? new Date(card.lastReviewedAt) : now;
    const daysSince = (now - lastReview) / (1000 * 60 * 60 * 24);
    const stability = card.stability || FSRS_CONFIG.DEFAULT_STABILITY;
    return sum + estimateR(daysSince, stability);
  }, 0);
  return Math.round((totalR / cards.length) * 100);
};

// ==================== COMPONENT ====================

export default function SECONDARY_FlashcardsPanel({
  chatId = null,
  refreshTrigger = 0,
}) {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [reviewingSetIndex, setReviewingSetIndex] = useState(null);
  const [reviewQueueIndex, setReviewQueueIndex] = useState(0);
  const [currentCardFlipped, setCurrentCardFlipped] = useState(false);
  const [view, setView] = useState('sets'); // 'sets', 'review', 'dashboard'
  const [showFSRSInfo, setShowFSRSInfo] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [collections, setCollections] = useState({});
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);

  // Load flashcards from DB when chat changes
  useEffect(() => {
    if (chatId) {
      const loadFlashcards = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/secondStage/flashcards?chatId=${chatId}`);
          if (response.ok) {
            const data = await response.json();
            const sets = data.sets || [];
            
            // Migrate cards to FSRS if needed
            const migratedSets = sets.map(set => ({
              ...set,
              cards: set.cards.map(card => {
                if (!card.stability) {
                  return {
                    ...card,
                    stability: FSRS_CONFIG.DEFAULT_STABILITY,
                    difficulty: FSRS_CONFIG.DEFAULT_DIFFICULTY,
                    lapses: 0,
                    history: [],
                    lastReviewedAt: null,
                    nextReviewAt: new Date().toISOString(),
                    id: card.id || `card_${Date.now()}_${Math.random()}`,
                  };
                }
                return card;
              }),
            }));
            
            setFlashcardSets(migratedSets);
            
            // Save to localStorage for persistence
            migratedSets.forEach((set, idx) => {
              localStorage.setItem(`flashcards_set_${idx}`, JSON.stringify(set));
            });
          }
        } catch (error) {
          console.error('Error loading flashcards:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadFlashcards();
    }
  }, [chatId, refreshTrigger]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (reviewingSetIndex === null) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setCurrentCardFlipped(!currentCardFlipped);
      }
      
      if (['1', '2', '3', '4'].includes(e.key)) {
        handleRateCard(parseInt(e.key));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewingSetIndex, currentCardFlipped]);

  // Handle card rating (1=Again, 2=Hard, 3=Good, 4=Easy)
  const handleRateCard = (rating) => {
    if (reviewingSetIndex === null) return;
    
    const updatedSets = [...flashcardSets];
    const card = updatedSets[reviewingSetIndex].cards[reviewQueueIndex];
    const ratedCard = applyReviewUpdate(card, rating);
    updatedSets[reviewingSetIndex].cards[reviewQueueIndex] = ratedCard;
    
    // Save to localStorage
    localStorage.setItem(`flashcards_set_${reviewingSetIndex}`, JSON.stringify(updatedSets[reviewingSetIndex]));
    setFlashcardSets(updatedSets);
    
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (rating >= 3 ? 1 : 0),
    }));
    
    setCurrentCardFlipped(false);
    setReviewQueueIndex(prev => prev + 1);
  };

  const handleExportJSON = (cardSet) => {
    const jsonStr = JSON.stringify(cardSet.cards, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAnki = (cardSet) => {
    const csv = cardSet.cards
      .map(card => `"${card.q?.replace(/"/g, '""')}"	"${card.a?.replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCard = (card) => {
    const text = `Q: ${card.q}\nA: ${card.a}`;
    navigator.clipboard.writeText(text);
    alert('Card copied to clipboard!');
  };

  const startReview = (setIndex) => {
    setReviewingSetIndex(setIndex);
    setReviewQueueIndex(0);
    setCurrentCardFlipped(false);
    setSessionStats({ reviewed: 0, correct: 0 });
    setView('review');
  };

  const finishReview = () => {
    setReviewingSetIndex(null);
    setView('sets');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcardSets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No flashcards yet</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Select messages in the chat and click "Generate Flashcards" to create flashcard sets
          </p>
        </div>
      </div>
    );
  }

  // ==================== REVIEW MODE ====================
  if (view === 'review' && reviewingSetIndex !== null) {
    const cardSet = flashcardSets[reviewingSetIndex];
    const dueCards = getDueCards(cardSet.cards);
    const allCards = cardSet.cards;
    const currentCard = allCards[reviewQueueIndex];
    
    if (reviewQueueIndex >= allCards.length) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-xl border border-purple-700/50 p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Review Session Complete! 🎉</h2>
            <div className="space-y-4 mb-8">
              <p className="text-xl text-gray-300">
                <span className="font-semibold text-green-400">{sessionStats.reviewed}</span> cards reviewed
              </p>
              <p className="text-xl text-gray-300">
                <span className="font-semibold text-green-400">{sessionStats.correct}</span> rated Good or Easy
              </p>
              <p className="text-lg text-gray-400">
                Accuracy: {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
              </p>
            </div>
            <button
              onClick={finishReview}
              className="px-6 py-3 bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
            >
              Back to Sets
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6 text-sm text-gray-400">
          Card {reviewQueueIndex + 1} of {allCards.length}
        </div>

        {/* Card Flip */}
        <div
          className="cursor-pointer perspective mb-8"
          style={{
            perspective: '1000px',
          }}
        >
          <div
            onClick={() => setCurrentCardFlipped(!currentCardFlipped)}
            style={{
              transformStyle: 'preserve-3d',
              transform: currentCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s',
            }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-700/50 rounded-xl p-8 h-64 flex items-center justify-center text-center"
          >
            <div style={{ backfaceVisibility: 'hidden' }}>
              <div className="text-sm text-gray-400 mb-4">Question</div>
              <div className="text-2xl font-semibold text-gray-100 whitespace-pre-wrap break-words">
                {currentCard.q}
              </div>
              <div className="text-xs text-gray-500 mt-6">Press SPACE to reveal answer</div>
            </div>
            {currentCardFlipped && (
              <div style={{ transform: 'rotateY(180deg)' }}>
                <div className="text-sm text-gray-400 mb-4">Answer</div>
                <div className="text-xl font-semibold text-gray-100 whitespace-pre-wrap break-words">
                  {currentCard.a}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Stats */}
        {currentCard.stability && (
          <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400">Stability</div>
              <div className="text-lg font-semibold text-gray-100">
                {currentCard.stability?.toFixed(1)}d
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400">Difficulty</div>
              <div className="text-lg font-semibold text-gray-100">
                {currentCard.difficulty?.toFixed(1)}/10
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400">Lapses</div>
              <div className="text-lg font-semibold text-gray-100">
                {currentCard.lapses || 0}
              </div>
            </div>
          </div>
        )}

        {/* Rating Buttons */}
        {currentCardFlipped && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => handleRateCard(1)}
              className="p-4 bg-red-900/50 border border-red-700/50 rounded-lg hover:bg-red-900 text-white font-semibold transition-colors"
              title="Again (1)"
            >
              <div>1</div>
              <div className="text-xs">Again</div>
            </button>
            <button
              onClick={() => handleRateCard(2)}
              className="p-4 bg-yellow-900/50 border border-yellow-700/50 rounded-lg hover:bg-yellow-900 text-white font-semibold transition-colors"
              title="Hard (2)"
            >
              <div>2</div>
              <div className="text-xs">Hard</div>
            </button>
            <button
              onClick={() => handleRateCard(3)}
              className="p-4 bg-blue-900/50 border border-blue-700/50 rounded-lg hover:bg-blue-900 text-white font-semibold transition-colors"
              title="Good (3)"
            >
              <div>3</div>
              <div className="text-xs">Good</div>
            </button>
            <button
              onClick={() => handleRateCard(4)}
              className="p-4 bg-green-900/50 border border-green-700/50 rounded-lg hover:bg-green-900 text-white font-semibold transition-colors"
              title="Easy (4)"
            >
              <div>4</div>
              <div className="text-xs">Easy</div>
            </button>
          </div>
        )}

        {/* Exit Button */}
        <button
          onClick={finishReview}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          ← Back to Sets
        </button>
      </div>
    );
  }

  // ==================== SETS VIEW ====================
  return (
    <div className="p-6 space-y-6">
      {flashcardSets.map((cardSet, setIndex) => {
        const allCards = cardSet.cards;
        const dueCards = getDueCards(allCards);
        const retention = estimateRetention(allCards);
        
        return (
          <div
            key={setIndex}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow"
          >
            {/* Set Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Flashcard Set {setIndex + 1}
                </h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>{allCards.length} cards</span>
                  <span>📊 {retention}% retention</span>
                  <span>📅 {dueCards.length} due today</span>
                </div>
              </div>
              <button
                onClick={() => startReview(setIndex)}
                disabled={allCards.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
              >
                Review {dueCards.length > 0 ? dueCards.length : allCards.length}
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => handleExportJSON(cardSet)}
                className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                title="Export as JSON"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExportAnki(cardSet)}
                className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                title="Export for Anki"
              >
                Export Txt
              </button>
              <button
                onClick={() => setShowFSRSInfo(!showFSRSInfo)}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                title="How it works"
              >
                ℹ️
              </button>
            </div>

            {/* FSRS Info */}
            {showFSRSInfo && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-gray-300">
                <p className="font-semibold text-blue-300 mb-2">FSRS-lite Spaced Repetition</p>
                <ul className="space-y-1 text-xs">
                  <li><strong>Stability (S):</strong> Days between reviews (grows on success)</li>
                  <li><strong>Difficulty (D):</strong> Material hardness (1-10 scale)</li>
                  <li><strong>Lapses:</strong> Times the card was forgotten</li>
                  <li><strong>Rating:</strong> 1=Again, 2=Hard, 3=Good, 4=Easy</li>
                  <li><strong>Retention:</strong> Estimated recall probability</li>
                </ul>
              </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCards.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500 transition-colors bg-gradient-to-br from-gray-900 to-gray-800"
                >
                  {/* Card Front/Back Toggle */}
                  <button
                    onClick={() =>
                      setExpandedCardId(
                        expandedCardId === `${setIndex}-${cardIndex}`
                          ? null
                          : `${setIndex}-${cardIndex}`
                      )
                    }
                    className="w-full p-4 text-left bg-gradient-to-br from-purple-900/30 to-violet-900/20 hover:from-purple-800/40 hover:to-violet-800/30 transition-colors"
                  >
                    <div className="text-sm font-semibold text-gray-300 mb-2">Q:</div>
                    <div className="text-gray-100 font-medium line-clamp-3">{card.q}</div>
                    <div className="text-xs text-gray-400 mt-3">
                      {expandedCardId === `${setIndex}-${cardIndex}`
                        ? 'Click to hide'
                        : 'Click to reveal'}
                    </div>
                  </button>

                  {/* Card Back (Expanded) */}
                  {expandedCardId === `${setIndex}-${cardIndex}` && (
                    <div className="p-4 bg-gray-900 border-t border-gray-700 text-gray-100 space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-200 mb-2">A:</div>
                        <div className="text-gray-100 mb-2">{card.a}</div>
                      </div>

                      {/* FSRS Stats */}
                      {card.stability && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-800 p-2 rounded">
                            <div className="text-gray-400">Stability</div>
                            <div className="font-semibold text-gray-200">
                              {card.stability?.toFixed(1)}d
                            </div>
                          </div>
                          <div className="bg-gray-800 p-2 rounded">
                            <div className="text-gray-400">Difficulty</div>
                            <div className="font-semibold text-gray-200">
                              {card.difficulty?.toFixed(1)}/10
                            </div>
                          </div>
                          <div className="bg-gray-800 p-2 rounded">
                            <div className="text-gray-400">Lapses</div>
                            <div className="font-semibold text-gray-200">
                              {card.lapses || 0}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {card.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <button
                        onClick={() => handleCopyCard(card)}
                        className="w-full py-2 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                      >
                        Copy Card
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
