/**
 * FILE: src/components/flashcards/ReviewCard.jsx
 * DESCRIPTION: Single card UI with flip animation and rating buttons
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ReviewCard({
  card,
  onRate,
  isLoading = false,
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleRate = (quality) => {
    if (!isLoading && onRate) {
      onRate(quality);
      setIsFlipped(false);
    }
  };

  const handleKeyPress = (e) => {
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

  return (
    <div
      className="flex flex-col gap-6"
      onKeyDown={handleKeyPress}
      role="region"
      aria-label="Flashcard review"
      tabIndex={0}
    >
      {/* Card Container */}
      <div className="relative h-64 cursor-pointer perspective">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full relative transition-all duration-300 transform ${
            isFlipped ? 'scale-x-[-1]' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute w-full h-full bg-gradient-to-br from-purple-900/30 to-violet-900/20 rounded-xl border border-purple-500 p-6 flex flex-col items-center justify-center text-center shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="text-sm font-semibold text-gray-300 mb-4">Question</div>
            <div className="text-xl font-medium text-white break-words">
              {card.front}
            </div>
            <div className="text-xs text-gray-400 mt-6 italic">
              Click or press space to reveal answer
            </div>
          </div>

          <div
            className="absolute w-full h-full bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl border border-green-500 p-6 flex flex-col items-center justify-center text-center shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-sm font-semibold text-gray-300 mb-4">Answer</div>
            <div className="text-xl font-medium text-white break-words">
              {card.back}
            </div>
            <div className="text-xs text-gray-400 mt-6 italic">
              Click or press space to close
            </div>
          </div>
        </button>
      </div>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {card.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Rating Buttons - show only when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-3">
          <Button
            onClick={() => handleRate(0)}
            disabled={isLoading}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-950"
          >
            <div className="text-center">
              <div className="text-sm font-bold">1</div>
              <div className="text-xs">Again</div>
            </div>
          </Button>

          <Button
            onClick={() => handleRate(3)}
            disabled={isLoading}
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-950"
          >
            <div className="text-center">
              <div className="text-sm font-bold">2</div>
              <div className="text-xs">Hard</div>
            </div>
          </Button>

          <Button
            onClick={() => handleRate(4)}
            disabled={isLoading}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-950"
          >
            <div className="text-center">
              <div className="text-sm font-bold">3</div>
              <div className="text-xs">Good</div>
            </div>
          </Button>

          <Button
            onClick={() => handleRate(5)}
            disabled={isLoading}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-950"
          >
            <div className="text-center">
              <div className="text-sm font-bold">4</div>
              <div className="text-xs">Easy</div>
            </div>
          </Button>
        </div>
      )}

      {/* Card Stats */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
          <div className="text-center">
            <div className="text-gray-300 font-semibold">
              {(card.stability || 0).toFixed(1)}d
            </div>
            <div>Stability</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">
              {(card.difficulty || 5).toFixed(1)}
            </div>
            <div>Difficulty</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">{card.lapses || 0}</div>
            <div>Lapses</div>
          </div>
          <div className="text-center">
            <div className="text-gray-300 font-semibold">
              {card.history ? card.history.length : 0}
            </div>
            <div>Reviews</div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center mt-4">
        💡 Keyboard: <kbd className="px-2 py-1 bg-gray-800 rounded">space</kbd> to flip
        {isFlipped && (
          <>
            {' | '}
            <kbd className="px-2 py-1 bg-gray-800 rounded">1</kbd>
            <kbd className="px-2 py-1 bg-gray-800 rounded">2</kbd>
            <kbd className="px-2 py-1 bg-gray-800 rounded">3</kbd>
            <kbd className="px-2 py-1 bg-gray-800 rounded">4</kbd> to rate
          </>
        )}
      </div>
    </div>
  );
}
