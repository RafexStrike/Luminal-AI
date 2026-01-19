/**
 * FILE: src/components/flashcards/CollectionSettings.jsx
 * DESCRIPTION: Collection settings dialog (target retention, max reviews per day)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CollectionSettings({
  isOpen = false,
  collection = null,
  onSave,
  onCancel,
}) {
  const [targetRetention, setTargetRetention] = useState(
    collection?.settings?.targetRetention * 100 || 90
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    collection?.settings?.maxReviewsPerDay || 50
  );

  const handleSave = async () => {
    await onSave?.({
      targetRetention: targetRetention / 100,
      maxReviewsPerDay: parseInt(maxReviewsPerDay, 10),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Retention */}
          <div>
            <Label htmlFor="retention">Target Retention Rate (%)</Label>
            <p className="text-xs text-gray-400 mb-2">
              Desired recall probability. Higher = longer intervals.
            </p>
            <div className="flex gap-2">
              <Input
                id="retention"
                type="range"
                min="50"
                max="99"
                value={targetRetention}
                onChange={(e) => setTargetRetention(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-gray-300 font-semibold min-w-12">
                {targetRetention}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {targetRetention <= 70
                ? '⚠️ Low retention - very frequent reviews'
                : targetRetention <= 80
                ? '⚡ Moderate - frequent reviews'
                : targetRetention <= 90
                ? '✅ Balanced (recommended)'
                : '🎯 High - less frequent but harder'}
            </p>
          </div>

          {/* Max Reviews Per Day */}
          <div>
            <Label htmlFor="max-reviews">Max Reviews Per Day</Label>
            <p className="text-xs text-gray-400 mb-2">
              Stop showing new reviews after this limit.
            </p>
            <Input
              id="max-reviews"
              type="number"
              min="1"
              max="500"
              value={maxReviewsPerDay}
              onChange={(e) => setMaxReviewsPerDay(e.target.value)}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <p className="text-sm text-blue-200">
              💡 <strong>Tip:</strong> Use 90% retention for balanced learning. Lower values
              require more daily reviews but improve retention.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
