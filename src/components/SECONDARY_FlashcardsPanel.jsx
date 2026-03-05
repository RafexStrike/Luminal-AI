// FILE: src/components/SECONDARY_FlashcardsPanel.jsx
// DESCRIPTION: Complete redesign — FSRS-lite flashcard learning dashboard
//
// FIXES:
//   1. FSRS state (scheduling) stored separately from API card content
//      → refreshes never wipe review history
//   2. Retention formula fixed (unreviewed cards show "New", not 100%)
//   3. isDue() compares against current moment, not start of day
//
// NEW FEATURES:
//   • Dashboard with stats, target date, calendar, weak concepts
//   • Per-card FSRS transparency (S, D, R, lapse count)
//   • Review session with next-interval previews on rating buttons
//   • Session completion summary
//   • Target memory date with daily workload calculation
//   • 7-day upcoming review calendar (bar chart)
//   • Cards browse with algorithm stats

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════
// FSRS-LITE ALGORITHM (self-contained)
// ═══════════════════════════════════════════════════════

const FSRS = {
  BASE_GAIN: 0.18,
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 3650,
  DEFAULT_STABILITY: 3,
  DEFAULT_DIFFICULTY: 5,
  TARGET_RETENTION: 0.9,
};

/** Forgetting curve: R(t) = e^(-t/S) */
function estimateR(daysSince, stability) {
  if (!stability || stability <= 0) return 0;
  if (daysSince <= 0) return 1;
  return Math.exp(-daysSince / stability);
}

/**
 * Apply FSRS-lite update
 * qualityUI: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
function applyFSRS(card, qualityUI, targetRetention = FSRS.TARGET_RETENTION) {
  const qMap = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const quality = qMap[qualityUI] ?? qualityUI;

  const now = new Date();
  const stability = card.stability || FSRS.DEFAULT_STABILITY;
  const difficulty = card.difficulty || FSRS.DEFAULT_DIFFICULTY;
  const lapses = card.lapses || 0;
  const lastReviewedAt = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
  const daysSince = lastReviewedAt ? (now - lastReviewedAt) / 86400000 : 0;

  let newS, newD, newL;

  if (quality === 0) {
    // Forgotten
    newS = Math.max(0.5, stability * 0.5);
    newD = Math.min(10, difficulty + 0.5);
    newL = lapses + 1;
  } else {
    // Recalled
    const R = estimateR(daysSince, stability);
    const qFn = (quality - 2) / 3; // Hard→1/3, Good→2/3, Easy→1
    const gain = FSRS.BASE_GAIN * qFn * (1 + (1 - R));
    newS = stability * (1 + gain);
    newD = Math.max(1, Math.min(10, difficulty - 0.05 * (quality - 3)));
    newL = lapses;
  }

  newS = Math.max(FSRS.MIN_INTERVAL, Math.min(FSRS.MAX_INTERVAL, newS));
  const intervalDays = -newS * Math.log(targetRetention);
  const nextReviewAt = new Date(now.getTime() + intervalDays * 86400000);

  return {
    ...card,
    stability: newS,
    difficulty: newD,
    lapses: newL,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    history: [...(card.history || []), { ts: now.toISOString(), quality, interval: intervalDays }],
  };
}

/** Compute preview next-interval for each rating option */
function previewIntervals(card, targetRetention = FSRS.TARGET_RETENTION) {
  const now = new Date();
  const result = {};
  [1, 2, 3, 4].forEach(q => {
    const updated = applyFSRS(card, q, targetRetention);
    const ms = new Date(updated.nextReviewAt) - now;
    const d = ms / 86400000;
    if (d < 1 / 24) result[q] = `${Math.max(1, Math.round(d * 1440))}m`;
    else if (d < 1) result[q] = `${Math.round(d * 24)}h`;
    else if (d < 7) result[q] = `${Math.round(d)}d`;
    else if (d < 30) result[q] = `${Math.round(d / 7)}w`;
    else result[q] = `${Math.round(d / 30)}mo`;
  });
  return result;
}

/** Is this card due for review right now? */
function isDue(fsrsCard) {
  if (!fsrsCard || !fsrsCard.nextReviewAt) return true;
  return new Date(fsrsCard.nextReviewAt) <= new Date();
}

/** Estimate average retention across reviewed cards. Returns null if none reviewed. */
function estimateRetention(fsrsCards) {
  const reviewed = fsrsCards.filter(c => c.lastReviewedAt && c.stability);
  if (reviewed.length === 0) return null;
  const now = new Date();
  const total = reviewed.reduce((sum, c) => {
    const days = (now - new Date(c.lastReviewedAt)) / 86400000;
    return sum + estimateR(days, c.stability);
  }, 0);
  return Math.round((total / reviewed.length) * 100);
}

// ═══════════════════════════════════════════════════════
// LOCALSTORAGE — FSRS STATE PERSISTENCE
// Key: flashcard_fsrs_v2_${chatId}
// Structure: { cards: { "setIdx_cardIdx": { ...fsrsFields } }, targetDate: string|null }
// ═══════════════════════════════════════════════════════

function fsrsKey(chatId) {
  return `flashcard_fsrs_v2_${chatId}`;
}

function loadFSRSState(chatId) {
  try {
    const raw = localStorage.getItem(fsrsKey(chatId));
    return raw ? JSON.parse(raw) : { cards: {}, targetDate: null };
  } catch {
    return { cards: {}, targetDate: null };
  }
}

function saveFSRSState(chatId, state) {
  try {
    localStorage.setItem(fsrsKey(chatId), JSON.stringify(state));
  } catch (e) {
    console.error('[Flashcards] Failed to persist FSRS state:', e);
  }
}

function cardKey(setIndex, cardIndex) {
  return `${setIndex}_${cardIndex}`;
}

function getFSRSCard(fsrsState, setIndex, cardIndex) {
  const key = cardKey(setIndex, cardIndex);
  return (
    fsrsState.cards[key] || {
      stability: FSRS.DEFAULT_STABILITY,
      difficulty: FSRS.DEFAULT_DIFFICULTY,
      lapses: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date(0).toISOString(), // epoch = always due (new card)
      history: [],
    }
  );
}

// ═══════════════════════════════════════════════════════
// SMALL UI HELPERS
// ═══════════════════════════════════════════════════════

function StatCard({ value, label, sub, colorClass = 'text-white', bgClass = 'from-gray-800 to-gray-900 border-gray-700' }) {
  return (
    <div className={`bg-gradient-to-br ${bgClass} rounded-xl border p-5`}>
      <div className={`text-4xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

function BarCalendar({ days, maxCount }) {
  const max = Math.max(maxCount, 1);
  return (
    <div className="space-y-2">
      {days.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-8 text-right text-xs font-semibold text-gray-400 flex-shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500"
              style={{ width: d.count > 0 ? `${Math.max((d.count / max) * 100, 5)}%` : '0%' }}
            />
          </div>
          <div className="w-20 text-xs flex-shrink-0">
            {d.count > 0 ? (
              <><span className="text-gray-200 font-semibold">{d.count}</span>
                <span className="text-gray-600"> cards</span></>
            ) : (
              <span className="text-gray-700">—</span>
            )}
          </div>
          <span className="text-xs text-gray-700 w-16 hidden md:inline flex-shrink-0">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function SECONDARY_FlashcardsPanel({ chatId = null, refreshTrigger = 0 }) {
  // ── API card content (question/answer text) ──────────────
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── FSRS scheduling state (persisted, never overwritten by API) ─
  const [fsrsState, setFsrsState] = useState({ cards: {}, targetDate: null });

  // ── UI state ─────────────────────────────────────────────
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'cards' | 'review'
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [targetDateInput, setTargetDateInput] = useState('');

  // ── Review session state ─────────────────────────────────
  const [reviewQueue, setReviewQueue] = useState([]); // [{ setIndex, cardIndex }]
  const [queuePos, setQueuePos] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // ── Step 1: Load card CONTENT from API (never saves scheduling here) ─
  useEffect(() => {
    if (!chatId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/secondStage/flashcards?chatId=${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setFlashcardSets(data.sets || []);
        }
      } catch (e) {
        console.error('[Flashcards] API load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chatId, refreshTrigger]);

  // ── Step 2: Load FSRS scheduling state independently from localStorage ─
  useEffect(() => {
    if (!chatId) return;
    const state = loadFSRSState(chatId);
    setFsrsState(state);
    if (state.targetDate) {
      setTargetDateInput(state.targetDate.split('T')[0]);
    }
  }, [chatId]);

  // ── Target date handler ──────────────────────────────────
  const handleSetTargetDate = useCallback(
    (dateStr) => {
      setTargetDateInput(dateStr);
      const newState = {
        ...fsrsState,
        targetDate: dateStr ? new Date(dateStr + 'T00:00:00').toISOString() : null,
      };
      setFsrsState(newState);
      saveFSRSState(chatId, newState);
    },
    [chatId, fsrsState]
  );

  // ── Start review session ──────────────────────────────────
  const handleStartReview = useCallback(
    (setIndex) => {
      const set = flashcardSets[setIndex];
      if (!set) return;
      const due = set.cards
        .map((_, cardIndex) => ({
          setIndex,
          cardIndex,
          fsrsCard: getFSRSCard(fsrsState, setIndex, cardIndex),
        }))
        .filter(item => isDue(item.fsrsCard));

      if (due.length === 0) {
        // No due cards — review all anyway (practice mode)
        const all = set.cards.map((_, cardIndex) => ({
          setIndex,
          cardIndex,
          fsrsCard: getFSRSCard(fsrsState, setIndex, cardIndex),
        }));
        setReviewQueue(all);
      } else {
        setReviewQueue(due);
      }

      setQueuePos(0);
      setIsFlipped(false);
      setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
      setReviewedCount(0);
      setShowSummary(false);
      setView('review');
    },
    [flashcardSets, fsrsState]
  );

  // ── Rate a card and persist ───────────────────────────────
  const handleRate = useCallback(
    (qualityUI) => {
      if (queuePos >= reviewQueue.length) return;
      const { setIndex, cardIndex } = reviewQueue[queuePos];
      const currentCard = getFSRSCard(fsrsState, setIndex, cardIndex);
      const updated = applyFSRS(currentCard, qualityUI);

      // Update ONLY the FSRS state — API data stays untouched
      const key = cardKey(setIndex, cardIndex);
      const newFsrsState = {
        ...fsrsState,
        cards: { ...fsrsState.cards, [key]: updated },
      };
      setFsrsState(newFsrsState);
      saveFSRSState(chatId, newFsrsState);

      const qNames = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
      setSessionStats(prev => ({ ...prev, [qNames[qualityUI]]: prev[qNames[qualityUI]] + 1 }));

      const next = queuePos + 1;
      setReviewedCount(next);
      setIsFlipped(false);

      if (next >= reviewQueue.length) {
        setShowSummary(true);
      } else {
        setQueuePos(next);
      }
    },
    [queuePos, reviewQueue, fsrsState, chatId]
  );

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    if (view !== 'review') return;
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
      if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleRate(parseInt(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, isFlipped, handleRate]);

  // ═══════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════

  const setStats = useMemo(() => {
    return flashcardSets.map((set, setIndex) => {
      const fsrsCards = set.cards.map((_, i) => getFSRSCard(fsrsState, setIndex, i));
      const dueCount = fsrsCards.filter(isDue).length;
      const retention = estimateRetention(fsrsCards);
      const avgStability =
        fsrsCards.reduce((s, c) => s + (c.stability || FSRS.DEFAULT_STABILITY), 0) / (fsrsCards.length || 1);
      const avgDifficulty =
        fsrsCards.reduce((s, c) => s + (c.difficulty || FSRS.DEFAULT_DIFFICULTY), 0) / (fsrsCards.length || 1);

      // Weak concepts: lowest stability
      const weakCards = fsrsCards
        .map((c, i) => ({ ...c, cardIndex: i }))
        .sort((a, b) => (a.stability || 0) - (b.stability || 0))
        .slice(0, 4);

      // 7-day upcoming calendar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const calDays = Array.from({ length: 7 }, (_, off) => {
        const d = new Date(today);
        d.setDate(d.getDate() + off + 1);
        const nd = new Date(d);
        nd.setDate(nd.getDate() + 1);
        const count = fsrsCards.filter(c => {
          if (!c.nextReviewAt) return false;
          const nr = new Date(c.nextReviewAt);
          return nr >= d && nr < nd;
        }).length;
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        };
      });
      const maxCalCount = Math.max(...calDays.map(d => d.count), 1);

      const reviewedToday = fsrsCards.filter(c => {
        if (!c.lastReviewedAt) return false;
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return new Date(c.lastReviewedAt) >= t;
      }).length;

      return {
        dueCount,
        retention,
        avgStability,
        avgDifficulty,
        weakCards,
        calDays,
        maxCalCount,
        total: set.cards.length,
        reviewedToday,
        fsrsCards,
      };
    });
  }, [flashcardSets, fsrsState]);

  // Global totals
  const globalStats = useMemo(() => {
    const totalCards = setStats.reduce((s, st) => s + st.total, 0);
    const totalDue = setStats.reduce((s, st) => s + st.dueCount, 0);
    const totalReviewedToday = setStats.reduce((s, st) => s + st.reviewedToday, 0);
    const allFsrsCards = setStats.flatMap(st => st.fsrsCards);
    const retention = estimateRetention(allFsrsCards);
    return { totalCards, totalDue, totalReviewedToday, retention };
  }, [setStats]);

  // Target date plan
  const targetPlan = useMemo(() => {
    if (!fsrsState.targetDate) return null;
    const target = new Date(fsrsState.targetDate);
    const now = new Date();
    const daysLeft = Math.ceil((target - now) / 86400000);
    if (daysLeft <= 0) return { daysLeft: 0, feasible: false };
    const cpd = Math.ceil(globalStats.totalDue / Math.max(daysLeft, 1));
    return { daysLeft, cardsPerDay: cpd, feasible: cpd <= 50, totalDue: globalStats.totalDue };
  }, [fsrsState.targetDate, globalStats.totalDue]);

  // ═══════════════════════════════════════════════════════
  // LOADING + EMPTY STATES
  // ═══════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto" />
          <p className="text-gray-400 text-sm">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!flashcardSets.length) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-5">🃏</div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">No flashcards yet</h2>
          <p className="text-gray-400 text-sm">
            Select messages in the chat and click{' '}
            <span className="text-purple-400 font-semibold">"Generate Flashcards"</span> to create your first set.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // REVIEW MODE — Session Summary
  // ═══════════════════════════════════════════════════════

  if (view === 'review' && showSummary) {
    const total = reviewQueue.length;
    const correct = sessionStats.good + sessionStats.easy;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-6xl animate-bounce">🎉</div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-100">Session Complete!</h2>
          <p className="text-gray-400 mt-1">Cards are scheduled for future review</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-xl">
          {[
            { label: 'Reviewed', value: total, color: 'text-white', bg: 'from-gray-800 to-gray-900 border-gray-700' },
            { label: 'Correct Rate', value: `${pct}%`, color: 'text-green-300', bg: 'from-green-900/20 to-emerald-900/20 border-green-700/50' },
            { label: 'Good/Easy', value: correct, color: 'text-blue-300', bg: 'from-blue-900/20 to-indigo-900/20 border-blue-700/50' },
            { label: 'Again', value: sessionStats.again, color: 'text-red-300', bg: 'from-red-900/20 to-red-900/20 border-red-700/50' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} border rounded-xl p-4 text-center`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-5 text-sm">
          {[
            { l: 'Again', v: sessionStats.again, c: 'bg-red-500' },
            { l: 'Hard', v: sessionStats.hard, c: 'bg-orange-500' },
            { l: 'Good', v: sessionStats.good, c: 'bg-green-500' },
            { l: 'Easy', v: sessionStats.easy, c: 'bg-blue-500' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5 text-gray-400">
              <div className={`w-2.5 h-2.5 rounded-full ${s.c}`} />
              {s.l}: <span className="text-gray-200 font-semibold ml-0.5">{s.v}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setView('dashboard')}
          className="px-10 py-3 bg-gradient-to-r from-purple-700 to-violet-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity text-base"
        >
          Back to Dashboard →
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // REVIEW MODE — Active Card
  // ═══════════════════════════════════════════════════════

  if (view === 'review' && reviewQueue.length > 0) {
    const { setIndex, cardIndex } = reviewQueue[queuePos];
    const apiCard = flashcardSets[setIndex]?.cards[cardIndex];
    const fsrsCard = getFSRSCard(fsrsState, setIndex, cardIndex);
    const intervals = previewIntervals(fsrsCard);
    const progress = (reviewedCount / reviewQueue.length) * 100;

    const ratingBtns = [
      { ui: 1, label: 'Again', key: '1', border: 'border-red-600 hover:bg-red-950/50', text: 'text-red-400', itext: 'text-red-300' },
      { ui: 2, label: 'Hard', key: '2', border: 'border-orange-600 hover:bg-orange-950/50', text: 'text-orange-400', itext: 'text-orange-300' },
      { ui: 3, label: 'Good', key: '3', border: 'border-green-600 hover:bg-green-950/50', text: 'text-green-400', itext: 'text-green-300' },
      { ui: 4, label: 'Easy', key: '4', border: 'border-blue-600 hover:bg-blue-950/50', text: 'text-blue-400', itext: 'text-blue-300' },
    ];

    return (
      <div className="flex flex-col h-full gap-4 p-6 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Review Session</h2>
            <p className="text-xs text-gray-400">
              Card{' '}
              <span className="font-semibold text-gray-200">{reviewedCount + 1}</span>{' '}
              of{' '}
              <span className="font-semibold text-gray-200">{reviewQueue.length}</span>
            </p>
          </div>
          <div className="flex gap-3 text-xs text-center">
            {[
              { l: 'Easy', v: sessionStats.easy, c: 'text-blue-400' },
              { l: 'Good', v: sessionStats.good, c: 'text-green-400' },
              { l: 'Hard', v: sessionStats.hard, c: 'text-orange-400' },
              { l: 'Again', v: sessionStats.again, c: 'text-red-400' },
            ].map(s => (
              <div key={s.l}>
                <div className={`font-bold ${s.c}`}>{s.v}</div>
                <div className="text-gray-600">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flip card */}
        <div
          onClick={() => setIsFlipped(f => !f)}
          className="flex-1 cursor-pointer"
          style={{ perspective: '1000px', minHeight: '180px', maxHeight: '240px' }}
        >
          <div
            className="w-full h-full relative transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-violet-900/20 p-8"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Question</div>
              <div className="text-xl font-medium text-white leading-relaxed">{apiCard?.q}</div>
              <div className="text-xs text-gray-500 mt-6 italic">Click or <kbd className="px-1 bg-gray-800/50 rounded">Space</kbd> to reveal</div>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-900/30 to-green-900/20 p-8"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Answer</div>
              <div className="text-xl font-medium text-white leading-relaxed">{apiCard?.a}</div>
            </div>
          </div>
        </div>

        {/* FSRS stats row */}
        <div className="grid grid-cols-4 gap-2 text-xs text-center bg-gray-900/60 rounded-xl p-3 border border-gray-800">
          {[
            { label: 'Stability', value: `${(fsrsCard.stability || FSRS.DEFAULT_STABILITY).toFixed(1)}d` },
            { label: 'Difficulty', value: (fsrsCard.difficulty || FSRS.DEFAULT_DIFFICULTY).toFixed(1) },
            { label: 'Lapses', value: fsrsCard.lapses || 0 },
            { label: 'Reviews', value: (fsrsCard.history || []).length },
          ].map(s => (
            <div key={s.label}>
              <div className="text-gray-200 font-semibold">{s.value}</div>
              <div className="text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rating buttons with interval preview */}
        <div className={`grid grid-cols-4 gap-3 transition-opacity duration-200 ${isFlipped ? 'opacity-100' : 'opacity-25 pointer-events-none'}`}>
          {ratingBtns.map(btn => (
            <button
              key={btn.ui}
              onClick={(e) => { e.stopPropagation(); if (isFlipped) handleRate(btn.ui); }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-transparent transition-all hover:scale-105 active:scale-95 ${btn.border} ${btn.text}`}
            >
              <span className="text-xs opacity-40">{btn.key}</span>
              <span className="text-sm font-bold">{btn.label}</span>
              <span className={`text-xs font-semibold ${btn.itext}`}>{intervals[btn.ui]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setView('dashboard')}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← End session
          </button>
          <span className="text-xs text-gray-700">
            💡 <kbd className="px-1 bg-gray-800 rounded text-gray-500">Space</kbd> flip
            {isFlipped && <> | <kbd className="px-1 bg-gray-800 rounded text-gray-500">1</kbd>–<kbd className="px-1 bg-gray-800 rounded text-gray-500">4</kbd> rate</>}
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // CARDS BROWSE VIEW
  // ═══════════════════════════════════════════════════════

  if (view === 'cards') {
    const set = flashcardSets[activeSetIndex];
    const st = setStats[activeSetIndex];
    if (!set) { setView('dashboard'); return null; }

    return (
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900/40">
          <button
            onClick={() => setView('dashboard')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Dashboard
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-300 font-semibold">
            Set {activeSetIndex + 1} — {set.cards.length} cards
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleStartReview(activeSetIndex)}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-700 to-violet-600 rounded-lg text-sm text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Review {st.dueCount > 0 ? `(${st.dueCount} due)` : 'all'}
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {set.cards.map((card, cardIndex) => {
              const fc = getFSRSCard(fsrsState, activeSetIndex, cardIndex);
              const due = isDue(fc);
              const now = new Date();
              const days = fc.lastReviewedAt ? (now - new Date(fc.lastReviewedAt)) / 86400000 : null;
              const R = days !== null && fc.stability ? estimateR(days, fc.stability) : null;
              const expanded = expandedCard === `${activeSetIndex}_${cardIndex}`;

              return (
                <div
                  key={cardIndex}
                  className={`rounded-xl border overflow-hidden transition-colors ${due ? 'border-orange-700/40 bg-orange-900/10' : 'border-gray-700/60 bg-gray-900/40'}`}
                >
                  <button
                    onClick={() => setExpandedCard(expanded ? null : `${activeSetIndex}_${cardIndex}`)}
                    className="w-full p-4 text-left hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Q</div>
                        <div className="text-gray-100 text-sm line-clamp-2">{card.q}</div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {due && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 border border-orange-700/50">
                            Due
                          </span>
                        )}
                        {R !== null && (
                          <span className="text-xs text-gray-500">{Math.round(R * 100)}% recall</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-800/60">
                      <div className="text-xs text-gray-500 mt-3 mb-1">A</div>
                      <div className="text-gray-200 text-sm mb-4">{card.a}</div>

                      {/* FSRS algorithm transparency */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Memory Stability', value: `${(fc.stability || FSRS.DEFAULT_STABILITY).toFixed(2)} days` },
                          { label: 'Difficulty', value: `${(fc.difficulty || FSRS.DEFAULT_DIFFICULTY).toFixed(2)} / 10` },
                          { label: 'Recall Probability', value: R !== null ? `${Math.round(R * 100)}%` : 'No data' },
                          { label: 'Lapses', value: fc.lapses || 0 },
                          { label: 'Total Reviews', value: (fc.history || []).length },
                          {
                            label: 'Next Review',
                            value: fc.nextReviewAt
                              ? new Date(fc.nextReviewAt) <= new Date()
                                ? 'Now'
                                : new Date(fc.nextReviewAt).toLocaleDateString()
                              : 'Now',
                          },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-800/60 rounded-lg p-2.5">
                            <div className="text-gray-500 mb-0.5">{item.label}</div>
                            <div className="text-gray-200 font-semibold">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {card.tags.map((tag, ti) => (
                            <span key={ti} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // DASHBOARD VIEW
  // ═══════════════════════════════════════════════════════

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Flashcard Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ── Global Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={globalStats.totalCards} label="Total Cards" bgClass="from-gray-800 to-gray-900 border-gray-700" />
          <StatCard
            value={globalStats.retention !== null ? `${globalStats.retention}%` : 'New'}
            label="Avg Retention"
            colorClass="text-green-300"
            bgClass="from-green-900/20 to-emerald-900/20 border-green-700/40"
            sub={globalStats.retention !== null ? undefined : 'Start reviewing to track'}
          />
          <StatCard
            value={globalStats.totalDue}
            label="Due Now"
            colorClass="text-orange-300"
            bgClass="from-orange-900/20 to-red-900/20 border-orange-700/40"
            sub={`~${Math.max(1, Math.ceil(globalStats.totalDue * 1.5))} min`}
          />
          <StatCard
            value={globalStats.totalReviewedToday}
            label="Reviewed Today"
            colorClass="text-purple-300"
            bgClass="from-purple-900/20 to-violet-900/20 border-purple-700/40"
            sub={globalStats.totalReviewedToday > 0 ? '✓ Keep it up!' : undefined}
          />
        </div>

        {/* ── Target Memory Date ── */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="font-semibold text-gray-200 mb-1">🎯 Target Memory Date</h3>
          <p className="text-xs text-gray-500 mb-4">
            Set a deadline — the system estimates daily study load to reach your goal
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="date"
              value={targetDateInput}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => handleSetTargetDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            {targetPlan ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-purple-300">{targetPlan.daysLeft}</span>
                  <span className="text-sm text-gray-400">days left</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${targetPlan.feasible ? 'text-green-300' : 'text-red-300'}`}>
                    {targetPlan.cardsPerDay}
                  </span>
                  <span className="text-sm text-gray-400">cards/day needed</span>
                </div>
                {!targetPlan.feasible && (
                  <span className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-1.5">
                    ⚠ Heavy workload — consider extending the deadline
                  </span>
                )}
                {targetPlan.feasible && (
                  <span className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-1.5">
                    ✓ Feasible study plan
                  </span>
                )}
                <button
                  onClick={() => handleSetTargetDate('')}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-600 italic">
                Select a date to see your study plan
              </span>
            )}
          </div>
        </div>

        {/* ── Per-set sections ── */}
        {flashcardSets.map((set, setIndex) => {
          const st = setStats[setIndex];
          return (
            <div key={setIndex} className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
              {/* Set header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-gray-900/60">
                <div>
                  <h3 className="font-semibold text-gray-200">Flashcard Set {setIndex + 1}</h3>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{st.total} cards</span>
                    <span>·</span>
                    <span className={st.dueCount > 0 ? 'text-orange-400 font-semibold' : 'text-gray-600'}>
                      {st.dueCount} due now
                    </span>
                    <span>·</span>
                    <span>
                      {st.retention !== null ? (
                        <span className="text-green-400">{st.retention}% retention</span>
                      ) : (
                        <span className="text-gray-600">Not yet reviewed</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveSetIndex(setIndex); setView('cards'); }}
                    className="px-3 py-1.5 text-xs text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors"
                  >
                    Browse Cards
                  </button>
                  <button
                    onClick={() => handleStartReview(setIndex)}
                    className="px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-purple-700 to-violet-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {st.dueCount > 0 ? `Review (${st.dueCount})` : 'Practice All'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">

                {/* Upcoming Reviews Calendar */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">📅 Upcoming Reviews — Next 7 Days</h4>
                  <p className="text-xs text-gray-600 mb-4">Scheduled review workload</p>
                  {st.calDays.every(d => d.count === 0) ? (
                    <div className="text-center text-gray-700 text-xs py-6">
                      Review cards to generate a schedule
                    </div>
                  ) : (
                    <BarCalendar days={st.calDays} maxCount={st.maxCalCount} />
                  )}
                </div>

                {/* Weak Concepts */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">🔥 Weak Concepts</h4>
                  <p className="text-xs text-gray-600 mb-4">Lowest memory stability — prioritize these</p>
                  {st.weakCards.length === 0 ? (
                    <div className="text-center text-gray-700 text-xs py-6">No cards yet</div>
                  ) : (
                    <div className="space-y-2.5">
                      {st.weakCards.map(wc => {
                        const apiCard = set.cards[wc.cardIndex];
                        const stabilityPct = Math.min((wc.stability || 0) / 14, 1) * 100;

                        return (
                          <div key={wc.cardIndex} className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="text-sm text-gray-200 line-clamp-1 flex-1">{apiCard?.q}</div>
                              <span className="text-xs bg-gray-700 text-gray-300 rounded px-1.5 py-0.5 flex-shrink-0">
                                {(wc.stability || FSRS.DEFAULT_STABILITY).toFixed(1)}d
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(wc.stability || 0) < 2 ? 'bg-red-500' :
                                      (wc.stability || 0) < 5 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.max(stabilityPct, 3)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 flex-shrink-0">
                                {wc.lastReviewedAt
                                  ? `Last: ${new Date(wc.lastReviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                  : 'Never reviewed'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Set analytics */}
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-800/60">
                  {[
                    { label: 'Avg Stability', value: `${st.avgStability.toFixed(1)}d` },
                    { label: 'Avg Difficulty', value: `${st.avgDifficulty.toFixed(1)}/10` },
                    { label: 'Reviewed Today', value: st.reviewedToday },
                    {
                      label: 'Study Time Est.',
                      value: `~${Math.max(1, Math.ceil(st.dueCount * 1.5))}m`,
                    },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800/40 rounded-lg p-3 text-center">
                      <div className="text-base font-bold text-gray-200">{item.value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
