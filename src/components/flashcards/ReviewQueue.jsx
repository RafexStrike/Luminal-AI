/**
 * FILE: src/components/flashcards/ReviewQueue.jsx
 * DESCRIPTION: Daily review queue - shows cards due for review with rating flow
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ReviewCard from './ReviewCard';
import { applyReviewUpdate, getDueCards } from '@/lib/helpers/flashcardHelpers';
import { persistCard } from '@/utils/flashcardIO';

export default function ReviewQueue({
  cards = [],
  collectionId = null,
  targetRetention = 0.9,
  onQueueEmpty = () => {},
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

  // Initialize queue on mount or when cards change
  useEffect(() => {
    const dueCards = getDueCards(cards);
    setQueue(dueCards);
    setCurrentCardIndex(0);
    setCompletedCount(0);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
  }, [cards, collectionId]);

  const handleRate = async (quality) => {
    if (queue.length === 0) return;

    setIsLoading(true);
    try {
      const card = queue[currentCardIndex];
      const updatedCard = applyReviewUpdate(card, quality, new Date(), targetRetention);

      // Persist updated card
      persistCard(updatedCard);

      // Update stats
      const qualityNames = { 0: 'again', 3: 'hard', 4: 'good', 5: 'easy' };
      const qualityName = qualityNames[quality];
      setSessionStats(prev => ({
        ...prev,
        [qualityName]: prev[qualityName] + 1,
      }));

      // Show toast notification
      const intervalDays = updatedCard.nextReviewAt
        ? Math.ceil(
            (new Date(updatedCard.nextReviewAt) - new Date()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      // Move to next card
      const nextIndex = currentCardIndex + 1;
      setCompletedCount(nextIndex);

      if (nextIndex >= queue.length) {
        // Queue complete
        setTimeout(() => onQueueEmpty?.(), 500);
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

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="text-6xl">✨</div>
        <h2 className="text-2xl font-bold text-gray-100">No reviews due today!</h2>
        <p className="text-gray-400 max-w-md">
          Great job keeping up with your flashcards. Come back later when more cards are due.
        </p>
      </div>
    );
  }

  const currentCard = queue[currentCardIndex];
  const progress = ((completedCount) / queue.length) * 100;

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Today's Review</h2>
          <p className="text-sm text-gray-400">
            {completedCount + 1} of {queue.length} cards
          </p>
        </div>

        {/* Session stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{sessionStats.easy}</div>
            <div className="text-gray-500">Easy</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{sessionStats.good}</div>
            <div className="text-gray-500">Good</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{sessionStats.hard}</div>
            <div className="text-gray-500">Hard</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{sessionStats.again}</div>
            <div className="text-gray-500">Again</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-violet-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current card */}
      <div className="flex-1 flex items-center justify-center">
        <ReviewCard
          card={currentCard}
          onRate={handleRate}
          isLoading={isLoading}
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
