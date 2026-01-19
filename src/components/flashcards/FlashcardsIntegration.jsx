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
