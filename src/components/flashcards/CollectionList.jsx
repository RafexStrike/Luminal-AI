/**
 * FILE: src/components/flashcards/CollectionList.jsx
 * DESCRIPTION: Sidebar list of collections
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CollectionList({
  collections = [],
  activeCollectionId = null,
  onSelectCollection,
  onCreateCollection,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = collections.filter(col =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-3 bg-gray-900 rounded-lg border border-gray-800 p-4">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-200">Collections</h3>

        {/* Create new button */}
        <Button
          onClick={onCreateCollection}
          className="w-full bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95"
          size="sm"
        >
          ➕ New Collection
        </Button>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Collections list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              {collections.length === 0
                ? 'No collections yet'
                : 'No collections match your search'}
            </div>
          ) : (
            filtered.map(collection => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection(collection.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeCollectionId === collection.id
                    ? 'bg-purple-900/30 border-purple-600 text-gray-100'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium truncate">{collection.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {collection.cardIds?.length || 0} cards
                </div>
                {collection.source === 'ai' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    AI Generated
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      {collections.length > 0 && (
        <div className="border-t border-gray-800 pt-3 text-xs text-gray-400">
          <div className="text-center">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} •{' '}
            {collections.reduce((sum, c) => sum + (c.cardIds?.length || 0), 0)} total cards
          </div>
        </div>
      )}
    </div>
  );
}
