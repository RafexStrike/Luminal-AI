// FILE: src/lib/tutoring/strategyPolicy.js
// DESCRIPTION: Pedagogical strategy selection based on mastery level
// RESPONSIBILITY: Pure function — map mastery probability → strategy name.
//
// Strategy ladder:
//   mastery < 0.3  →  prerequisite_review   (student is missing foundational knowledge)
//   mastery < 0.5  →  scaffolding            (student needs explicit support structures)
//   mastery < 0.7  →  socratic_questioning   (student can discover with guided questions)
//   mastery < 0.9  →  challenge              (student needs stretch to consolidate)
//   mastery ≥ 0.9  →  synthesis             (student can integrate and apply)

/** Ordered strategy thresholds — evaluated top-to-bottom. */
const STRATEGY_THRESHOLDS = [
    { maxMastery: 0.3, strategy: 'prerequisite_review' },
    { maxMastery: 0.5, strategy: 'scaffolding' },
    { maxMastery: 0.7, strategy: 'socratic_questioning' },
    { maxMastery: 0.9, strategy: 'challenge' },
];

/** Fallback strategy when mastery ≥ 0.9. */
const SYNTHESIS_STRATEGY = 'synthesis';

/**
 * All valid strategy identifiers, for reference by callers.
 * @type {string[]}
 */
export const STRATEGIES = [
    'prerequisite_review',
    'scaffolding',
    'socratic_questioning',
    'challenge',
    'synthesis',
];

/**
 * Select the pedagogical strategy for the next question.
 *
 * @param {number} mastery — average mastery probability [0, 1]
 * @returns {string}       — one of STRATEGIES
 */
export function selectStrategy(mastery) {
    for (const { maxMastery, strategy } of STRATEGY_THRESHOLDS) {
        if (mastery < maxMastery) {
            return strategy;
        }
    }
    return SYNTHESIS_STRATEGY;
}

/**
 * Human-readable label for a strategy identifier.
 * Useful for prompt construction.
 *
 * @param {string} strategy — one of STRATEGIES
 * @returns {string}
 */
export function strategyLabel(strategy) {
    const labels = {
        prerequisite_review: 'Prerequisite Review — fill in foundational gaps with simple, concrete questions',
        scaffolding: 'Scaffolding — provide structure and break the problem into smaller steps',
        socratic_questioning: 'Socratic Questioning — use probing questions to guide the student to the answer',
        challenge: 'Challenge — push the student with harder or edge-case questions',
        synthesis: 'Synthesis — ask the student to integrate knowledge and apply it to new contexts',
    };
    return labels[strategy] ?? strategy;
}
