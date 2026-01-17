// FILE: src/components/SECONDARY_FlashcardsPanel.jsx
// DESCRIPTION: Flashcards display panel; shows generated cards with export/copy functionality

'use client';

import { useState, useEffect } from 'react';

/**
 * SECONDARY_FlashcardsPanel
 * 
 * Features:
 *   - Display list of flashcard sets for current chat
 *   - Each card shows question/answer with difficulty and tags
 *   - Export JSON button
 *   - Copy card content button
 *   - Empty state prompts user to select messages and generate flashcards
 * 
 * Data flow:
 *   - User selects messages in chat and clicks "Generate Flashcards" button
 *   - Request sent to /api/secondStage/flashcards { messageIds }
 *   - API returns { cards: [{q, a, difficulty, tags}, ...] }
 *   - Cards displayed in grid/list view
 *   - User can export or copy individual cards
 */
export default function SECONDARY_FlashcardsPanel({
  chatId = null,
  refreshTrigger = 0,
}) {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Load flashcards from DB when chat changes
  useEffect(() => {
    if (chatId) {
      const loadFlashcards = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/secondStage/flashcards?chatId=${chatId}`);
          if (response.ok) {
            const data = await response.json();
            setFlashcardSets(data.sets || []);
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

  const handleCopyCard = (card) => {
    const text = `Q: ${card.q}\nA: ${card.a}`;
    navigator.clipboard.writeText(text);
    alert('Card copied to clipboard!');
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

  return (
    <div className="p-6 space-y-6">
      {flashcardSets.map((cardSet, setIndex) => (
        <div
          key={setIndex}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow text-white"
        >
          {/* Set Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Flashcard Set {setIndex + 1}
            </h3>
            <button
              onClick={() => handleExportJSON(cardSet)}
              className="px-3 py-2 text-sm bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded-lg hover:opacity-95 transition-colors flex items-center gap-2"
              title="Export as JSON"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12M8 11l4 4 4-4" />
              </svg>
              Export
            </button>
          </div>

          {/* Card Count */}
          <div className="text-sm text-gray-400 mb-4">{cardSet.cards.length} cards</div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cardSet.cards.map((card, cardIndex) => (
              <div
                key={cardIndex}
                className="border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500 transition-colors bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"
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
                      ? 'Click to hide answer'
                      : 'Click to reveal answer'}
                  </div>
                </button>

                {/* Card Back (Expanded) */}
                {expandedCardId === `${setIndex}-${cardIndex}` && (
                  <div className="p-4 bg-gray-900 border-t border-gray-700 text-gray-100">
                    <div className="text-sm font-semibold text-gray-200 mb-2">A:</div>
                    <div className="text-gray-100 mb-4">{card.a}</div>

                    {/* Tags and Difficulty */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {card.difficulty && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            card.difficulty === 'easy'
                              ? 'bg-green-800 text-green-200'
                              : card.difficulty === 'medium'
                              ? 'bg-yellow-800 text-yellow-200'
                              : 'bg-red-800 text-red-200'
                          }`}
                        >
                          {card.difficulty}
                        </span>
                      )}
                      {card.tags &&
                        card.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCard(card)}
                      className="w-full py-2 text-sm bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded hover:opacity-95 transition-colors"
                    >
                      Copy Card
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
