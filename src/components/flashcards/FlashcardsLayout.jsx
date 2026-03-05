/**
 * FILE: src/components/flashcards/FlashcardsLayout.jsx
 * DESCRIPTION: Main flashcards layout - orchestrates collections, review, dashboard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import CollectionList from './CollectionList';
import CollectionHeader from './CollectionHeader';
import ReviewQueue from './ReviewQueue';
import FlashcardDashboard from './FlashcardDashboard';
import CardEditorModal from './CardEditorModal';
import CollectionSettings from './CollectionSettings';
import FlashcardsDocPopup from './FlashcardsDocPopup';
import { Button } from '@/components/ui/button';
import {
  loadCollections,
  loadCollectionCards,
  persistCollection,
  persistCard,
  createCollection,
  createCard,
  deleteCollection,
  importAIGeneratedCards,
  exportCollectionAsJSON,
  exportCollectionAsAnkiCSV,
} from '@/utils/flashcardIO';
import { getDailyStats } from '@/lib/helpers/flashcardHelpers';

const VIEWS = {
  DASHBOARD: 'dashboard',
  COLLECTION: 'collection',
  REVIEW: 'review',
};

export default function FlashcardsLayout({ chatId = null, onGenerateFlashcards = null }) {
  // Collections
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [allCards, setAllCards] = useState({});

  // UI State
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocPopupOpen, setIsDocPopupOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Load collections on mount
  useEffect(() => {
    const loaded = loadCollections();
    setCollections(loaded);

    // Load all cards
    const cardMap = {};
    loaded.forEach(collection => {
      const collectionCards = loadCollectionCards(collection.id);
      collectionCards.forEach(card => {
        cardMap[card.id] = card;
      });
    });
    setAllCards(cardMap);

    // Select first collection if available
    if (loaded.length > 0 && !activeCollectionId) {
      setActiveCollectionId(loaded[0].id);
    }
  }, []);

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeCollectionCards = activeCollection
    ? Object.values(allCards).filter(c => c.collectionId === activeCollection.id)
    : [];

  // Handle collection selection
  const handleSelectCollection = useCallback((collectionId) => {
    setActiveCollectionId(collectionId);
    setCurrentView(VIEWS.COLLECTION);
  }, []);

  // Handle create collection
  const handleCreateCollection = useCallback(async () => {
    const name = prompt('Collection name:', 'New Collection');
    if (!name) return;

    const newCollection = createCollection({
      name,
      source: 'user',
      cardIds: [],
    });

    setCollections(prev => [...prev, newCollection]);
    persistCollection(newCollection);
    setActiveCollectionId(newCollection.id);
    setCurrentView(VIEWS.COLLECTION);
  }, []);

  // Handle add card
  const handleAddCard = useCallback(async (cardData) => {
    if (!activeCollection) return;

    const newCard = createCard({
      ...cardData,
      collectionId: activeCollection.id,
    });

    setAllCards(prev => ({ ...prev, [newCard.id]: newCard }));
    persistCard(newCard);

    // Add to collection
    const updated = {
      ...activeCollection,
      cardIds: [...(activeCollection.cardIds || []), newCard.id],
    };
    setCollections(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    persistCollection(updated);
  }, [activeCollection]);

  // Handle save card
  const handleSaveCard = useCallback(async (cardData) => {
    await handleAddCard(cardData);
    setIsCardEditorOpen(false);
    setEditingCard(null);
  }, [handleAddCard]);

  // Handle start review
  const handleStartReview = useCallback(() => {
    if (activeCollection && activeCollectionCards.length > 0) {
      setCurrentView(VIEWS.REVIEW);
    }
  }, [activeCollection, activeCollectionCards]);

  // Handle individual card reviewed — update in-memory state immediately
  // so the dashboard due-count reflects the review right away
  const handleCardReviewed = useCallback((updatedCard) => {
    setAllCards(prev => ({
      ...prev,
      [updatedCard.id]: updatedCard,
    }));
  }, []);

  // Handle review session complete
  const handleReviewComplete = useCallback(() => {
    setCurrentView(VIEWS.COLLECTION);
    // Re-read from localStorage to ensure full consistency
    if (activeCollection) {
      const updated = loadCollectionCards(activeCollection.id);
      const newCardMap = { ...allCards };
      updated.forEach(card => {
        newCardMap[card.id] = card;
      });
      setAllCards(newCardMap);
    }
  }, [activeCollection, allCards]);

  // Handle save settings
  const handleSaveSettings = useCallback(async (settings) => {
    if (!activeCollection) return;

    const updated = {
      ...activeCollection,
      settings: {
        ...activeCollection.settings,
        ...settings,
      },
    };

    setCollections(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    persistCollection(updated);
    setIsSettingsOpen(false);
  }, [activeCollection]);

  // Handle delete collection
  const handleDeleteCollection = useCallback(() => {
    if (!activeCollection) return;

    if (
      !confirm(`Are you sure you want to delete "${activeCollection.name}"? This cannot be undone.`)
    ) {
      return;
    }

    deleteCollection(activeCollection.id);
    setCollections(prev => prev.filter(c => c.id !== activeCollection.id));

    // Remove cards from cardMap
    const newCardMap = { ...allCards };
    Object.keys(newCardMap).forEach(id => {
      if (newCardMap[id].collectionId === activeCollection.id) {
        delete newCardMap[id];
      }
    });
    setAllCards(newCardMap);

    setActiveCollectionId(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, [activeCollection, allCards]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!activeCollection || activeCollectionCards.length === 0) {
      alert('No cards to export');
      return;
    }

    // Show export format choice
    const format = prompt(
      'Export format?\nEnter: json or anki',
      'json'
    );

    if (!format) return;

    let data;
    let filename;

    if (format.toLowerCase() === 'anki') {
      data = exportCollectionAsAnkiCSV(activeCollectionCards, activeCollection.name);
      filename = `${activeCollection.name.replace(/\s+/g, '_')}.csv`;
    } else {
      data = exportCollectionAsJSON(activeCollectionCards);
      filename = `${activeCollection.name.replace(/\s+/g, '_')}.json`;
    }

    // Download
    const blob = new Blob([data], {
      type: format.toLowerCase() === 'anki' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeCollection, activeCollectionCards]);

  const dailyStats = getDailyStats(activeCollectionCards);

  return (
    <div className="flex h-full gap-6 bg-gray-950 p-6 rounded-xl border border-gray-800">
      {/* Left sidebar - Collections */}
      <div className="w-64 flex-shrink-0">
        <CollectionList
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={handleCreateCollection}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                onClick={() => setCurrentView(VIEWS.DASHBOARD)}
                variant={currentView === VIEWS.DASHBOARD ? 'default' : 'ghost'}
                className="mr-2"
              >
                📊 Dashboard
              </Button>
              {activeCollection && (
                <>
                  <Button
                    onClick={() => setCurrentView(VIEWS.COLLECTION)}
                    variant={currentView === VIEWS.COLLECTION ? 'default' : 'ghost'}
                    className="mr-2"
                  >
                    📚 Collection
                  </Button>
                  {dailyStats.dueTodayCount > 0 && (
                    <Button
                      onClick={() => setCurrentView(VIEWS.REVIEW)}
                      variant={currentView === VIEWS.REVIEW ? 'default' : 'ghost'}
                      className="mr-2 bg-red-900/30 hover:bg-red-800/40"
                    >
                      🎯 Review ({dailyStats.dueTodayCount})
                    </Button>
                  )}
                </>
              )}
            </div>

            <Button
              onClick={() => setIsDocPopupOpen(true)}
              variant="outline"
              size="sm"
            >
              ℹ️ Help
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === VIEWS.DASHBOARD && (
            <FlashcardDashboard collections={collections} allCards={allCards} />
          )}

          {currentView === VIEWS.COLLECTION && activeCollection && (
            <div className="space-y-6">
              <CollectionHeader
                collection={activeCollection}
                cardCount={activeCollectionCards.length}
                dueCount={dailyStats.dueTodayCount}
                onStartReview={handleStartReview}
                onAddCard={() => {
                  setEditingCard(null);
                  setIsCardEditorOpen(true);
                }}
                onEditSettings={() => setIsSettingsOpen(true)}
                onShowInfo={() => setIsDocPopupOpen(true)}
                onExport={handleExport}
                onDelete={handleDeleteCollection}
              />

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCollectionCards.map(card => (
                  <div
                    key={card.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setEditingCard(card);
                      setIsCardEditorOpen(true);
                    }}
                  >
                    <div className="font-semibold text-gray-200 line-clamp-2">
                      {card.front}
                    </div>
                    <div className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {card.back}
                    </div>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="text-purple-400">S: {(card.stability || 0).toFixed(1)}d</span>
                      <span className="text-blue-400">D: {(card.difficulty || 5).toFixed(1)}</span>
                      <span className="text-gray-500">Lapses: {card.lapses || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === VIEWS.REVIEW && activeCollection && (
            <ReviewQueue
              cards={activeCollectionCards}
              collectionId={activeCollection.id}
              targetRetention={activeCollection.settings?.targetRetention || 0.9}
              onQueueEmpty={handleReviewComplete}
              onCardReviewed={handleCardReviewed}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CardEditorModal
        isOpen={isCardEditorOpen}
        card={editingCard}
        onSave={handleSaveCard}
        onCancel={() => {
          setIsCardEditorOpen(false);
          setEditingCard(null);
        }}
      />

      <CollectionSettings
        isOpen={isSettingsOpen}
        collection={activeCollection}
        onSave={handleSaveSettings}
        onCancel={() => setIsSettingsOpen(false)}
      />

      <FlashcardsDocPopup
        isOpen={isDocPopupOpen}
        onClose={() => setIsDocPopupOpen(false)}
      />
    </div>
  );
}
