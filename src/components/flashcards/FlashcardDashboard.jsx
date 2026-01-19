/**
 * FILE: src/components/flashcards/FlashcardDashboard.jsx
 * DESCRIPTION: Dashboard with retention stats, due cards, and upcoming schedule
 */

'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  estimateCollectionRetention,
  getLowStabilityCards,
  getDailyStats,
  getUpcomingCards,
  formatInterval,
  estimateR,
} from '@/lib/helpers/flashcardHelpers';

export default function FlashcardDashboard({
  collections = [],
  allCards = {},
}) {
  const stats = useMemo(() => {
    const totalCards = Object.keys(allCards).length;
    
    // Get all cards as array
    const cardsArray = Object.values(allCards);
    
    // Calculate retention across all collections
    const avgRetention = estimateCollectionRetention(cardsArray);
    
    // Get due today
    const dailyStats = getDailyStats(cardsArray);
    
    // Get upcoming (next 7 days)
    const upcomingCards = getUpcomingCards(cardsArray, 7);
    
    // Get low stability cards for review
    const lowStabilityCards = getLowStabilityCards(cardsArray, 5);
    
    return {
      totalCards,
      avgRetention,
      dueTodayCount: dailyStats.dueTodayCount,
      upcomingCount: dailyStats.upcomingCount,
      reviewedTodayCount: dailyStats.reviewedTodayCount,
      lowStabilityCards,
      upcomingCards: upcomingCards.slice(0, 7),
    };
  }, [allCards, collections]);

  // Estimated study load
  const estimatedMinutes = Math.max(1, Math.ceil(stats.dueTodayCount * 1.5));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total cards */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-6">
          <div className="text-4xl font-bold text-gray-100">
            {stats.totalCards}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total Cards</div>
        </Card>

        {/* Retention */}
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700 p-6">
          <div className="text-4xl font-bold text-green-300">
            {(stats.avgRetention * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Avg Retention</div>
          <Progress
            value={stats.avgRetention * 100}
            className="mt-3 h-2"
          />
        </Card>

        {/* Due today */}
        <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-700 p-6">
          <div className="text-4xl font-bold text-orange-300">
            {stats.dueTodayCount}
          </div>
          <div className="text-sm text-gray-400 mt-1">Due Today</div>
          <div className="text-xs text-gray-500 mt-2">
            ~{estimatedMinutes} min of study
          </div>
        </Card>

        {/* Reviewed today */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 border-purple-700 p-6">
          <div className="text-4xl font-bold text-purple-300">
            {stats.reviewedTodayCount}
          </div>
          <div className="text-sm text-gray-400 mt-1">Reviewed Today</div>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stability cards */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-4">📚 Priority Study</h3>
          <p className="text-xs text-gray-400 mb-4">
            Cards with lowest stability - focus on these for better retention
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.lowStabilityCards.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No cards yet
              </div>
            ) : (
              stats.lowStabilityCards.map(card => (
                <div
                  key={card.id}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition"
                >
                  <div className="font-medium text-gray-200 line-clamp-2">
                    {card.front}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      S: {(card.stability || 0).toFixed(1)}d
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      D: {(card.difficulty || 5).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming schedule */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-4">📅 Next 7 Days</h3>
          <p className="text-xs text-gray-400 mb-4">
            Cards scheduled for review in the coming week
          </p>

          <div className="space-y-3">
            {stats.upcomingCards.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No cards scheduled
              </div>
            ) : (
              stats.upcomingCards.map((card, idx) => {
                const daysUntil = Math.ceil(
                  (new Date(card.nextReviewAt) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={card.id}
                    className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-200 text-sm line-clamp-1">
                        {card.front}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(card.nextReviewAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      +{daysUntil}d
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Collections overview */}
      {collections.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-4">📚 Collections</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(collection => {
              const collectionCards = Object.values(allCards).filter(
                c => c.collectionId === collection.id
              );
              const retention = estimateCollectionRetention(collectionCards);
              const dueTodayInCollection = collectionCards.filter(card => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return card.nextReviewAt && new Date(card.nextReviewAt) <= today;
              }).length;

              return (
                <div
                  key={collection.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition"
                >
                  <div className="font-medium text-gray-200 truncate mb-2">
                    {collection.name}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>{collectionCards.length} cards</div>
                    <div>{dueTodayInCollection} due today</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span>R: {(retention * 100).toFixed(0)}%</span>
                      <Progress value={retention * 100} className="h-1 flex-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
