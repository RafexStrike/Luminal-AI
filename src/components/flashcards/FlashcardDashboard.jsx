/**
 * FILE: src/components/flashcards/FlashcardDashboard.jsx
 * DESCRIPTION: Learning dashboard — stats, upcoming schedule, and weak concepts
 */

'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  estimateCollectionRetention,
  getLowStabilityCards,
  getDailyStats,
  getUpcomingCards,
  formatInterval,
  estimateR,
} from '@/lib/helpers/flashcardHelpers';

// Day-of-week labels
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Group upcoming cards by calendar day for the next 7 days
 */
function groupCardsByDay(cards, today = new Date()) {
  const groups = [];
  for (let i = 1; i <= 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayCards = cards.filter(card => {
      if (!card.nextReviewAt) return false;
      const nr = new Date(card.nextReviewAt);
      return nr >= day && nr < nextDay;
    });

    groups.push({
      label: DAY_LABELS[day.getDay()],
      date: day,
      count: dayCards.length,
      isToday: false,
    });
  }
  return groups;
}

export default function FlashcardDashboard({ collections = [], allCards = {} }) {
  const today = new Date();
  const cardsArray = Object.values(allCards);

  const stats = useMemo(() => {
    const totalCards = cardsArray.length;
    const avgRetention = estimateCollectionRetention(cardsArray);
    const dailyStats = getDailyStats(cardsArray);
    const upcomingCards = getUpcomingCards(cardsArray, 7);
    const lowStabilityCards = getLowStabilityCards(cardsArray, 6);
    const upcomingByDay = groupCardsByDay(cardsArray);
    const maxDayCount = Math.max(...upcomingByDay.map(d => d.count), 1);

    return {
      totalCards,
      avgRetention,
      dueTodayCount: dailyStats.dueTodayCount,
      reviewedTodayCount: dailyStats.reviewedTodayCount,
      lowStabilityCards,
      upcomingByDay,
      maxDayCount,
      upcomingCards,
    };
  }, [allCards, collections]);

  const estimatedMinutes = Math.max(1, Math.ceil(stats.dueTodayCount * 1.5));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-100">Learning Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cards */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-5">
          <div className="text-4xl font-bold text-gray-100">{stats.totalCards}</div>
          <div className="text-sm text-gray-400 mt-1">Total Cards</div>
          <div className="text-xs text-gray-600 mt-1">across {collections.length} collection{collections.length !== 1 ? 's' : ''}</div>
        </Card>

        {/* Retention */}
        <Card className="bg-gradient-to-br from-green-900/25 to-emerald-900/20 border-green-700/50 p-5">
          <div className="text-4xl font-bold text-green-300">
            {(stats.avgRetention * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Avg Retention</div>
          <Progress value={stats.avgRetention * 100} className="mt-3 h-1.5" />
        </Card>

        {/* Due Today */}
        <Card className="bg-gradient-to-br from-orange-900/25 to-red-900/20 border-orange-700/50 p-5">
          <div className="text-4xl font-bold text-orange-300">{stats.dueTodayCount}</div>
          <div className="text-sm text-gray-400 mt-1">Due Now</div>
          <div className="text-xs text-gray-500 mt-1">~{estimatedMinutes} min</div>
        </Card>

        {/* Reviewed Today */}
         <Card className="bg-gradient-to-br from-indigo-900/25 to-blue-900/20 border-indigo-700/50 p-5">
           <div className="text-4xl font-bold text-indigo-300">{stats.reviewedTodayCount}</div>
           <div className="text-sm text-gray-400 mt-1">Reviewed Today</div>
           {stats.reviewedTodayCount > 0 && (
             <div className="text-xs text-indigo-400/70 mt-1">✓ Great work!</div>
           )}
         </Card>
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Reviews Calendar */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-1">📅 Upcoming Reviews</h3>
          <p className="text-xs text-gray-500 mb-5">Next 7 days — scheduled workload</p>

          {stats.upcomingByDay.every(d => d.count === 0) ? (
            <div className="text-center text-gray-600 py-8 text-sm">
              No cards scheduled yet. Complete a review session first!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingByDay.map((day, idx) => {
                const barPct = stats.maxDayCount > 0
                  ? (day.count / stats.maxDayCount) * 100
                  : 0;
                const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={idx} className="flex items-center gap-3">
                    {/* Day label */}
                    <div className="w-10 text-right text-xs font-semibold text-gray-400 flex-shrink-0">
                      {day.label}
                    </div>

                    {/* Bar */}
                    <div className="flex-1 bg-gray-800 rounded-full h-5 relative overflow-hidden">
                         <div
                           className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full transition-all duration-500"
                           style={{ width: `${Math.max(barPct, day.count > 0 ? 4 : 0)}%` }}
                         />
                    </div>

                    {/* Count */}
                    <div className="w-16 text-xs text-gray-400 flex-shrink-0">
                      {day.count > 0 ? (
                        <span className="text-gray-200 font-semibold">{day.count}</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}{' '}
                      {day.count > 0 && <span className="text-gray-500">cards</span>}
                    </div>

                    {/* Date */}
                    <div className="w-14 text-xs text-gray-600 flex-shrink-0 hidden md:block">
                      {dateStr}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Weak Concepts */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-1">🔥 Weak Concepts</h3>
          <p className="text-xs text-gray-500 mb-5">Lowest memory stability — focus here</p>

          {stats.lowStabilityCards.length === 0 ? (
            <div className="text-center text-gray-600 py-8 text-sm">
              No cards yet. Generate or add some cards to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lowStabilityCards.map(card => {
                const stability = card.stability || 0;
                // Stability in range 0–10 for a meaningful bar (10d = "strong")
                const stabilityPct = Math.min(stability / 10, 1) * 100;
                const lastReview = card.lastReviewedAt
                  ? new Date(card.lastReviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Never';

                return (
                  <div key={card.id} className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium text-gray-200 text-sm line-clamp-2 flex-1">
                        {card.front}
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0 bg-gray-700">
                        {stability.toFixed(1)}d
                      </Badge>
                    </div>

                    {/* Stability bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${stability < 2 ? 'bg-red-500' :
                              stability < 5 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.max(stabilityPct, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        Last: {lastReview}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Collections Overview ── */}
      {collections.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="font-semibold text-gray-200 mb-4">📚 Collections</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(collection => {
              const collectionCards = cardsArray.filter(
                c => c.collectionId === collection.id
              );
              const retention = estimateCollectionRetention(collectionCards);
              const now = new Date();
              const dueCount = collectionCards.filter(card =>
                !card.nextReviewAt || new Date(card.nextReviewAt) <= now
              ).length;

              return (
                <div
                  key={collection.id}
                  className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/60 hover:border-gray-500/60 transition"
                >
                  <div className="font-medium text-gray-200 truncate mb-2">
                    {collection.name}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>{collectionCards.length} cards</span>
                      {dueCount > 0 && (
                        <span className="text-orange-400 font-semibold">{dueCount} due</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">R:</span>
                      <Progress value={retention * 100} className="h-1 flex-1" />
                      <span className="text-gray-300 font-semibold">
                        {(retention * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty state when no collections */}
      {collections.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-800/50 border-dashed p-12 text-center">
          <div className="text-5xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No collections yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Create a collection from the sidebar, or generate flashcards from a chat conversation to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
