/**
 * FILE: src/lib/helpers/flashcardHelpers.js
 * DESCRIPTION: FSRS-lite algorithm implementation and flashcard utilities
 * 
 * FSRS-lite is a practical, deterministic spaced repetition scheduler based on FSRS v3.
 * Full spec: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
 * 
 * Core concepts:
 *   - Difficulty (D): how hard the material is (1-10 scale)
 *   - Stability (S): memory trace strength (in days)
 *   - Retrievability (R): estimated recall probability (0-1)
 *   - R(t) = exp(-t / S): exponential decay
 *   - targetRetention: desired recall rate (default 0.9 = 90%)
 * 
 * This implementation is upgradeable to full FSRS v4 by swapping scheduler functions.
 */

/**
 * Estimate current recall probability based on days since last review
 * 
 * @param {number} daysSince - days since last review (fractional OK)
 * @param {number} stability - current stability in days
 * @returns {number} estimated retrievability (0-1)
 */
export function estimateR(daysSince, stability) {
  if (stability <= 0 || daysSince < 0) return 0;
  return Math.exp(-daysSince / stability);
}

/**
 * Apply FSRS-lite review update rules
 * 
 * @param {Object} card - card object with current S, D, lapses, lastReviewedAt
 * @param {number} quality - user rating: 0 (Again) | 3 (Hard) | 4 (Good) | 5 (Easy)
 * @param {Date|string} now - current timestamp
 * @param {number} targetRetention - desired recall rate (default 0.9)
 * @returns {Object} updated card with new S, D, lapses, lastReviewedAt, nextReviewAt, history entry
 * 
 * Algorithm:
 *   1. If forgotten (q <= 2):
 *      - S_new = max(0.5, S_old * 0.5)
 *      - D_new = D_old + 0.5
 *      - lapses++
 *   2. Else (q >= 3, successful):
 *      - gain = baseGain * f(q) * (1 + (1 - R))
 *        where f(q) = (q - 2) / 3
 *      - S_new = S_old * (1 + gain)
 *      - D_new = clamp(D_old - 0.05 * (q - 3), 1, 10)
 *   3. Compute next interval: t_next = -S_new * ln(targetRetention)
 *   4. Clamp interval to [minInterval, maxInterval]
 *   5. Persist history record with ts, quality, interval
 */
export function applyReviewUpdate(card, quality, now, targetRetention = 0.9) {
  const timestamp = new Date(now);
  
  // Get previous stability or use default
  let stability = card.stability || 3;
  let difficulty = card.difficulty || 5;
  let lapses = card.lapses || 0;
  
  // Calculate days since last review
  const lastReviewedAt = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  let daysSince = 0;
  if (lastReviewedAt && lastReviewedAt < timestamp) {
    daysSince = (timestamp - lastReviewedAt) / (1000 * 60 * 60 * 24);
  }
  
  // Constants (tunable)
  const BASE_GAIN = 0.18;
  const MIN_INTERVAL = 1;
  const MAX_INTERVAL = 3650; // 10 years
  
  let stabilityNew = stability;
  let difficultyNew = difficulty;
  let lapsesNew = lapses;
  
  if (quality <= 2) {
    // Forgotten card
    stabilityNew = Math.max(0.5, stability * 0.5);
    difficultyNew = difficulty + 0.5;
    lapsesNew = lapses + 1;
  } else {
    // Successful recall
    const R = estimateR(daysSince, stability);
    const qualityFn = (quality - 2) / 3; // Hard(3)→1/3, Good(4)→2/3, Easy(5)→1
    const gain = BASE_GAIN * qualityFn * (1 + (1 - R));
    
    stabilityNew = stability * (1 + gain);
    difficultyNew = Math.max(1, Math.min(10, difficulty - 0.05 * (quality - 3)));
  }
  
  // Clamp difficulty
  difficultyNew = Math.max(1, Math.min(10, difficultyNew));
  
  // Schedule next review: solve exp(-t / S) = targetRetention
  // => t = -S * ln(targetRetention)
  let intervalDays = -stabilityNew * Math.log(targetRetention);
  intervalDays = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, intervalDays));
  
  // Calculate next review date
  const nextReviewAt = new Date(timestamp);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  
  // Build history record
  const historyEntry = {
    ts: timestamp.toISOString(),
    quality,
    interval: daysSince, // interval that just ended
  };
  
  // Update card
  const updatedCard = {
    ...card,
    stability: stabilityNew,
    difficulty: difficultyNew,
    lapses: lapsesNew,
    lastReviewedAt: timestamp.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    history: [...(card.history || []), historyEntry],
  };
  
  return updatedCard;
}

/**
 * Get cards that are due for review today
 * 
 * @param {Array} cards - array of card objects
 * @param {Date|string} today - reference date (default today)
 * @returns {Array} cards due for review, sorted by nextReviewAt
 */
export function getDueCards(cards, today = new Date()) {
  const refDate = new Date(today);
  refDate.setHours(0, 0, 0, 0);
  
  return cards.filter(card => {
    if (!card.nextReviewAt) return true; // Never reviewed
    const nextReview = new Date(card.nextReviewAt);
    return nextReview <= refDate;
  }).sort((a, b) => {
    const aDate = a.nextReviewAt ? new Date(a.nextReviewAt) : new Date(0);
    const bDate = b.nextReviewAt ? new Date(b.nextReviewAt) : new Date(0);
    return aDate - bDate;
  });
}

/**
 * Get cards due in the next N days
 * 
 * @param {Array} cards - array of card objects
 * @param {number} daysAhead - number of days to look ahead
 * @param {Date|string} fromDate - start date (default today)
 * @returns {Array} cards due within daysAhead
 */
export function getUpcomingCards(cards, daysAhead = 7, fromDate = new Date()) {
  const refDate = new Date(fromDate);
  refDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(refDate);
  endDate.setDate(endDate.getDate() + daysAhead);
  
  return cards.filter(card => {
    if (!card.nextReviewAt) return false;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview > refDate && nextReview <= endDate;
  }).sort((a, b) => {
    const aDate = new Date(a.nextReviewAt);
    const bDate = new Date(b.nextReviewAt);
    return aDate - bDate;
  });
}

/**
 * Compute collection-wide retention estimate
 * Average of current R values across all cards
 * 
 * @param {Array} cards - array of card objects
 * @param {Date|string} today - reference date
 * @returns {number} average retrievability (0-1)
 */
export function estimateCollectionRetention(cards, today = new Date()) {
  if (!cards || cards.length === 0) return 0;
  
  const refDate = new Date(today);
  
  const retrievabilities = cards.map(card => {
    const lastReview = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
    if (!lastReview || !card.stability) return 1; // Never reviewed, assume stable
    
    const daysSince = (refDate - lastReview) / (1000 * 60 * 60 * 24);
    return estimateR(daysSince, card.stability);
  });
  
  const avg = retrievabilities.reduce((a, b) => a + b, 0) / retrievabilities.length;
  return Math.round(avg * 10000) / 10000;
}

/**
 * Find lowest-stability cards in a collection (priority study items)
 * 
 * @param {Array} cards - array of cards
 * @param {number} limit - max cards to return
 * @returns {Array} cards sorted by stability (ascending)
 */
export function getLowStabilityCards(cards, limit = 5) {
  return cards
    .slice()
    .sort((a, b) => {
      const stabilityA = a.stability || 0;
      const stabilityB = b.stability || 0;
      return stabilityA - stabilityB;
    })
    .slice(0, limit);
}

/**
 * Migrate card if missing FSRS fields
 * Populate defaults and estimate S from history if available
 * 
 * @param {Object} card - card object (may lack S, D, history)
 * @param {number} defaultStability - default S if no history (default 3)
 * @param {number} defaultDifficulty - default D (default 5)
 * @returns {Object} migrated card with all required fields
 */
export function migrateCard(card, defaultStability = 3, defaultDifficulty = 5) {
  const migrated = { ...card };
  
  // Ensure all fields exist
  if (!migrated.id) migrated.id = `card_${Date.now()}_${Math.random()}`;
  if (!migrated.front) migrated.front = '';
  if (!migrated.back) migrated.back = '';
  if (!migrated.tags) migrated.tags = [];
  if (!migrated.history) migrated.history = [];
  if (!migrated.lapses) migrated.lapses = 0;
  
  // Estimate or set stability
  if (!migrated.stability || migrated.stability <= 0) {
    if (migrated.history && migrated.history.length > 1) {
      // Estimate from last two reviews
      const hist = migrated.history.slice(-2);
      if (hist.length === 2) {
        const t1 = new Date(hist[0].ts);
        const t2 = new Date(hist[1].ts);
        const estimatedInterval = (t2 - t1) / (1000 * 60 * 60 * 24);
        migrated.stability = Math.max(0.5, estimatedInterval);
      } else {
        migrated.stability = defaultStability;
      }
    } else {
      migrated.stability = defaultStability;
    }
  }
  
  // Set difficulty
  if (!migrated.difficulty || migrated.difficulty < 1 || migrated.difficulty > 10) {
    migrated.difficulty = defaultDifficulty;
  }
  
  // Set review timestamps if missing
  if (!migrated.lastReviewedAt && migrated.history && migrated.history.length > 0) {
    migrated.lastReviewedAt = migrated.history[migrated.history.length - 1].ts;
  }
  
  if (!migrated.nextReviewAt) {
    // If no next review scheduled, assume due now
    migrated.nextReviewAt = new Date(0).toISOString();
  }
  
  return migrated;
}

/**
 * Simulate FSRS-lite behavior on an example card for educational purposes
 * Returns a walkthrough of two reviews
 * 
 * @returns {Object} { initial, review1, review2, explanation }
 */
export function simulateExample() {
  const initialCard = {
    id: 'example_card_1',
    front: 'What is the capital of France?',
    back: 'Paris',
    tags: ['geography'],
    history: [],
    stability: 3,
    difficulty: 5,
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
  };
  
  // First review: user rates "Good" (quality 4)
  const review1Date = new Date();
  const afterReview1 = applyReviewUpdate(initialCard, 4, review1Date, 0.9);
  
  // Second review: 7 days later, user rates "Easy" (quality 5)
  const review2Date = new Date(review1Date);
  review2Date.setDate(review2Date.getDate() + 7);
  const afterReview2 = applyReviewUpdate(afterReview1, 5, review2Date, 0.9);
  
  return {
    initial: initialCard,
    review1: {
      date: review1Date.toISOString(),
      quality: 4,
      rating: 'Good',
      result: afterReview1,
      explanation: 'User rated "Good". Stability increased, next interval ~6 days.',
    },
    review2: {
      date: review2Date.toISOString(),
      quality: 5,
      rating: 'Easy',
      result: afterReview2,
      explanation: 'User rated "Easy" 7 days later. Stability increased more, next interval ~35 days.',
    },
  };
}

/**
 * Calculate daily review stats for a collection
 * 
 * @param {Array} cards - array of cards
 * @param {Date|string} today - reference date
 * @returns {Object} { dueTodayCount, upcomingCount, reviewedTodayCount, totalCards }
 */
export function getDailyStats(cards, today = new Date()) {
  if (!cards || cards.length === 0) {
    return { dueTodayCount: 0, upcomingCount: 0, reviewedTodayCount: 0, totalCards: 0 };
  }
  
  const refDate = new Date(today);
  refDate.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date(refDate);
  endOfToday.setHours(23, 59, 59, 999);
  
  const dueTodayCount = cards.filter(card => {
    if (!card.nextReviewAt) return true;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview <= endOfToday;
  }).length;
  
  const upcomingCount = cards.filter(card => {
    if (!card.nextReviewAt) return false;
    const nextReview = new Date(card.nextReviewAt);
    return nextReview > endOfToday && nextReview <= new Date(refDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;
  
  const reviewedTodayCount = cards.filter(card => {
    if (!card.lastReviewedAt) return false;
    const lastReview = new Date(card.lastReviewedAt);
    return lastReview >= refDate && lastReview <= endOfToday;
  }).length;
  
  return {
    dueTodayCount,
    upcomingCount,
    reviewedTodayCount,
    totalCards: cards.length,
  };
}

/**
 * Format interval in human-readable form
 * 
 * @param {number} days - number of days
 * @returns {string} e.g., "3d", "4w", "2mo"
 */
export function formatInterval(days) {
  if (days < 1) return '< 1d';
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

/**
 * Export cards to Anki format (.apkg compatible CSV)
 * 
 * @param {Array} cards - cards to export
 * @param {string} deckName - name for Anki deck
 * @returns {string} CSV content
 */
export function exportToAnkiCSV(cards, deckName = 'Exported Deck') {
  const headers = ['#notetype:Basic', '#deck:' + deckName];
  const rows = cards.map(card => {
    const front = (card.front || '').replace(/\n/g, '<br>').replace(/"/g, '""');
    const back = (card.back || '').replace(/\n/g, '<br>').replace(/"/g, '""');
    const tags = (card.tags || []).join(' ');
    return `"${front}"	"${back}"	${tags}`;
  });
  
  return [...headers, ...rows].join('\n');
}

/**
 * Export cards to JSON format
 * 
 * @param {Array} cards - cards to export
 * @returns {string} JSON string
 */
export function exportToJSON(cards) {
  return JSON.stringify(cards, null, 2);
}
