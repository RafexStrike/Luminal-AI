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
           <Card className="bg-indigo-900/30 border-indigo-700 p-4 text-center">
             <div className="text-3xl font-bold text-indigo-300">{sessionStats.easy + sessionStats.good}</div>
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
           className="bg-gradient-to-r from-indigo-700 to-blue-600 hover:opacity-95 px-8 py-3 text-base"
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
           className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full transition-all duration-500"
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
