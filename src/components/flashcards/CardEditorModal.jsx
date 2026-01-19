/**
 * FILE: src/components/flashcards/CardEditorModal.jsx
 * DESCRIPTION: Create/edit card UI with front/back text areas and tags
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function CardEditorModal({
  isOpen = false,
  card = null,
  onSave,
  onCancel,
}) {
  const [front, setFront] = useState(card?.front || '');
  const [back, setBack] = useState(card?.back || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(card?.tags || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      alert('Please fill in both front and back of the card');
      return;
    }

    setIsLoading(true);
    try {
      await onSave?.({
        ...card,
        front: front.trim(),
        back: back.trim(),
        tags,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card?.id ? 'Edit Card' : 'Create New Card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Front */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Front (Question)
            </label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What is the capital of France?"
              className="min-h-24"
            />
          </div>

          {/* Back */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Back (Answer)
            </label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paris"
              className="min-h-24"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag (press Enter)"
                className="flex-1"
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:opacity-75"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !front.trim() || !back.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
