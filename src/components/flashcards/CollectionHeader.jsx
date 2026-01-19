/**
 * FILE: src/components/flashcards/CollectionHeader.jsx
 * DESCRIPTION: Header for active collection with actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function CollectionHeader({
  collection,
  cardCount = 0,
  dueCount = 0,
  onStartReview,
  onAddCard,
  onEditSettings,
  onShowInfo,
  onExport,
  onDelete,
}) {
  if (!collection) {
    return (
      <div className="text-center text-gray-400 py-8">
        Select or create a collection to begin
      </div>
    );
  }

  const createdDate = new Date(collection.createdAt).toLocaleDateString();

  return (
    <div className="space-y-4">
      {/* Title and meta */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">{collection.name}</h2>
          <div className="flex gap-3 mt-2">
            <Badge variant="outline">{cardCount} cards</Badge>
            {dueCount > 0 && (
              <Badge className="bg-red-900 text-red-200">
                {dueCount} due today
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {collection.source === 'ai' ? '🤖 AI-Generated' : '👤 Manual'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Created {createdDate}
            </Badge>
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              ⋮ Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Collection Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onStartReview} disabled={dueCount === 0}>
              🎯 Start Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddCard}>
              ➕ Add Card
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditSettings}>
              ⚙️ Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowInfo}>
              ℹ️ How It Works
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              📥 Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-400 focus:text-red-400"
            >
              🗑️ Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2">
        {dueCount > 0 && (
          <Button
            onClick={onStartReview}
            className="bg-gradient-to-r from-purple-700 to-violet-600 hover:opacity-95"
          >
            🎯 Review {dueCount} Cards
          </Button>
        )}
        <Button onClick={onAddCard} variant="outline">
          ➕ Add Card
        </Button>
      </div>
    </div>
  );
}
