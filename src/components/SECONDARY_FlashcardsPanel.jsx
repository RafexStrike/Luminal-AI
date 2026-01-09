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
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcardSets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">🎴</div>
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
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Set Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Flashcard Set {setIndex + 1}
            </h3>
            <button
              onClick={() => handleExportJSON(cardSet)}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
              title="Export as JSON"
            >
              <span>📥</span>
              Export
            </button>
          </div>

          {/* Card Count */}
          <div className="text-sm text-gray-500 mb-4">
            {cardSet.cards.length} cards
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cardSet.cards.map((card, cardIndex) => (
              <div
                key={cardIndex}
                className="border border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
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
                  className="w-full p-4 text-left bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                >
                  <div className="text-sm font-semibold text-gray-700 mb-2">Q:</div>
                  <div className="text-gray-900 font-medium line-clamp-3">{card.q}</div>
                  <div className="text-xs text-gray-500 mt-3">
                    {expandedCardId === `${setIndex}-${cardIndex}`
                      ? '👇 Click to hide answer'
                      : '👉 Click to reveal answer'}
                  </div>
                </button>

                {/* Card Back (Expanded) */}
                {expandedCardId === `${setIndex}-${cardIndex}` && (
                  <div className="p-4 bg-white border-t border-gray-300">
                    <div className="text-sm font-semibold text-gray-700 mb-2">A:</div>
                    <div className="text-gray-900 mb-4">{card.a}</div>

                    {/* Tags and Difficulty */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {card.difficulty && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            card.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : card.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {card.difficulty}
                        </span>
                      )}
                      {card.tags &&
                        card.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCard(card)}
                      className="w-full py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      📋 Copy Card
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
