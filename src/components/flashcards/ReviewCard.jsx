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
