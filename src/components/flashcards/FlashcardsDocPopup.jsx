/**
 * FILE: src/components/flashcards/FlashcardsDocPopup.jsx
 * DESCRIPTION: Interactive documentation popup explaining FSRS-lite algorithm
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { simulateExample } from '@/lib/helpers/flashcardHelpers';

export default function FlashcardsDocPopup({
  isOpen = false,
  onClose,
  imageUrl = null,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExample, setShowExample] = useState(false);
  const example = simulateExample();

  const handleExportPDF = () => {
    alert('PDF export coming soon! For now, use your browser print function (Ctrl+P).');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Flashcards Work (FSRS-lite)</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
            <TabsTrigger value="example">Example</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">What is FSRS?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                FSRS stands for <strong>Free Spaced Repetition Scheduler</strong>. It's a scientific
                algorithm for optimizing how often you review material to maximize long-term retention
                while minimizing study time.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Core Concepts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-purple-300">📊 Stability (S)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    How strong your memory is for a card (in days). Higher stability = you can wait longer
                    before reviewing.
                  </p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-blue-300">⚡ Difficulty (D)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    How hard the material is (scale 1-10). Harder cards require more frequent reviews.
                  </p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="font-semibold text-green-300">🎯 Retrievability (R)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated probability you'll remember (0-100%). Decays over time until you review.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">The Formula</h3>
              <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg font-mono text-xs">
                <div className="text-purple-300">R(t) = e^(-t / S)</div>
                <p className="text-gray-400 text-xs mt-2">
                  Your recall probability decays exponentially. Each review increases Stability, pushing
                  the decay curve outward.
                </p>
              </div>
            </div>

            {/* Optional image */}
            {imageUrl && (
              <div>
                <h3 className="font-semibold mb-2">Visualization</h3>
                <img
                  src={imageUrl}
                  alt="Spaced repetition timeline"
                  className="w-full rounded-lg border border-gray-700"
                />
              </div>
            )}

            {/* Fallback SVG if no image */}
            {!imageUrl && (
              <div>
                <h3 className="font-semibold mb-2">Review Timeline</h3>
                <svg viewBox="0 0 600 300" className="w-full bg-gray-800 rounded-lg">
                  {/* X axis */}
                  <line x1="40" y1="250" x2="560" y2="250" stroke="#666" strokeWidth="2" />
                  <text x="570" y="255" fontSize="12" fill="#aaa">
                    Days
                  </text>

                  {/* Y axis */}
                  <line x1="40" y1="40" x2="40" y2="250" stroke="#666" strokeWidth="2" />
                  <text x="15" y="45" fontSize="12" fill="#aaa">
                    R(t)
                  </text>

                  {/* Curve before first review */}
                  <path
                    d="M 60 60 Q 150 100 250 200"
                    stroke="#ff6b6b"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />

                  {/* Review point 1 */}
                  <circle cx="250" cy="200" r="4" fill="#ffd700" />
                  <text x="250" y="220" fontSize="11" fill="#ffd700" textAnchor="middle">
                    Review 1
                  </text>

                  {/* Curve after review 1 */}
                  <path
                    d="M 250 200 Q 350 160 450 220"
                    stroke="#4ecdc4"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* Review point 2 */}
                  <circle cx="450" cy="220" r="4" fill="#ffd700" />
                  <text x="450" y="240" fontSize="11" fill="#ffd700" textAnchor="middle">
                    Review 2
                  </text>

                  {/* Legend */}
                  <text x="60" y="30" fontSize="11" fill="#aaa">
                    🔴 Decay without review | 🔵 Growth after review
                  </text>
                </svg>
              </div>
            )}
          </TabsContent>

          {/* Algorithm Tab */}
          <TabsContent value="algorithm" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Update Rules</h3>
              <p className="text-gray-400 text-sm mb-3">
                When you review a card, we update S and D based on your rating:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="font-semibold text-red-300">❌ Again (0)</div>
                  <div className="text-xs text-gray-300 mt-1 font-mono">
                    S_new = max(0.5, S × 0.5)
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Stability cuts in half. Difficulty increases. Lapses count up.
                  </p>
                </div>

                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="font-semibold text-yellow-300">🟡 Hard (3)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Smaller stability gain. Difficulty rises slightly. Review sooner.
                  </p>
                </div>

                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="font-semibold text-green-300">✅ Good (4)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Solid stability gain. Difficulty decreases slightly. Standard interval.
                  </p>
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="font-semibold text-blue-300">🎯 Easy (5)</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Large stability gain. Difficulty decreases. Longest interval.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Calculation</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-gray-800 rounded font-mono">
                  gain = 0.18 × f(q) × (1 + (1 - R))
                </div>
                <div className="p-2 bg-gray-800 rounded font-mono">
                  S_new = S × (1 + gain)
                </div>
                <div className="p-2 bg-gray-800 rounded font-mono">
                  t_next = -S × ln(targetRetention)
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                The algorithm boosts gains when you recall just before forgetting, ensuring efficient
                spacing.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-200">
                💡 <strong>Key insight:</strong> This is FSRS-lite. The full FSRS v4 includes advanced
                parameter optimization and additional factors.
              </p>
            </div>
          </TabsContent>

          {/* Example Tab */}
          <TabsContent value="example" className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Worked Example</h3>
              <p className="text-gray-400 text-sm mb-4">
                Watch how a card evolves through reviews:
              </p>
            </div>

            {/* Initial card */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="font-semibold text-gray-200 mb-2">Initial Card</div>
              <div className="text-sm text-gray-300">
                <strong>Q:</strong> {example.initial.front}
              </div>
              <div className="text-sm text-gray-300">
                <strong>A:</strong> {example.initial.back}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">S: {example.initial.stability}d</Badge>
                <Badge variant="secondary">D: {example.initial.difficulty}</Badge>
              </div>
            </div>

            {/* Review 1 */}
            <div className="p-4 bg-green-900/10 rounded-lg border border-green-700">
              <div className="font-semibold text-green-300 mb-2">
                ✅ Review 1: Rated "{example.review1.rating}"
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Date: {new Date(example.review1.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-300 mb-3">{example.review1.explanation}</div>
              <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                <div>
                  <strong>S:</strong> {example.initial.stability} → {example.review1.result.stability.toFixed(2)}d
                </div>
                <div>
                  <strong>D:</strong> {example.initial.difficulty} → {example.review1.result.difficulty.toFixed(2)}
                </div>
                <div>
                  <strong>Next review:</strong> {new Date(example.review1.result.nextReviewAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-700">
              <div className="font-semibold text-blue-300 mb-2">
                🎯 Review 2: Rated "{example.review2.rating}"
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Date: {new Date(example.review2.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-300 mb-3">{example.review2.explanation}</div>
              <div className="p-2 bg-gray-800 rounded text-xs space-y-1">
                <div>
                  <strong>S:</strong> {example.review1.result.stability.toFixed(2)} →{' '}
                  {example.review2.result.stability.toFixed(2)}d
                </div>
                <div>
                  <strong>D:</strong> {example.review1.result.difficulty.toFixed(2)} →{' '}
                  {example.review2.result.difficulty.toFixed(2)}
                </div>
                <div>
                  <strong>Next review:</strong> {new Date(example.review2.result.nextReviewAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <Button onClick={() => setShowExample(!showExample)} variant="outline" className="w-full">
              {showExample ? 'Hide' : 'Show'} Step-by-Step Calculation
            </Button>

            {showExample && (
              <div className="p-4 bg-purple-900/10 rounded-lg border border-purple-700 text-xs font-mono space-y-2">
                <div>
                  <span className="text-gray-400">Review 1 calculations:</span>
                </div>
                <div className="text-gray-300">
                  f(4) = (4 - 2) / 3 = 0.667 (Good rating factor)
                </div>
                <div className="text-gray-300">
                  gain = 0.18 × 0.667 = 0.12
                </div>
                <div className="text-gray-300">
                  S_new = 3 × (1 + 0.12) = 3.36d
                </div>
              </div>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Why did my intervals increase?
              </h4>
              <p className="text-sm text-gray-400">
                A: Whenever you rate a card "Hard", "Good", or "Easy", your stability increases.
                Higher stability = longer intervals before the next review.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: What are "Lapses"?
              </h4>
              <p className="text-sm text-gray-400">
                A: A lapse is when you fail to recall a card (rate "Again"). Lapses are tracked to help
                identify problematic cards and adjust difficulty.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Should I increase or decrease target retention?
              </h4>
              <p className="text-sm text-gray-400">
                A: <strong>90% is recommended</strong>. Lower values (70-80%) require more daily reviews but
                higher retention. Higher values (95%+) reduce review load but risk forgetting.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: Can I snooze a review?
              </h4>
              <p className="text-sm text-gray-400">
                A: Yes, use the "Skip" button during review. But be careful—the algorithm already
                optimizes timing. Frequent snoozing reduces learning efficiency.
              </p>
            </div>

            <div className="border-b border-gray-700" />

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">
                Q: How do I export my cards?
              </h4>
              <p className="text-sm text-gray-400">
                A: Use the "Export" button on your collection. We support Anki (.apkg) and JSON formats
                so you can use cards in other tools.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex gap-2 justify-end border-t border-gray-800 pt-4 mt-4">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            📄 Export PDF
          </Button>
          <Button onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
