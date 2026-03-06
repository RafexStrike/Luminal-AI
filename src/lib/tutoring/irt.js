// FILE: src/lib/tutoring/irt.js
// DESCRIPTION: Item Response Theory (1PL logistic model)
// RESPONSIBILITY: Pure functions — model P(correct) and update student ability.
//
// Model:
//   P(correct | ability, difficulty) = 1 / (1 + exp(-(ability - difficulty)))
//
// Ability update (online gradient ascent on log-likelihood, step size α = 0.1):
//   CORRECT:   ability += α * (1 - P_correct)   [reward upward when hard]
//   INCORRECT: ability -= α * P_correct          [penalise when easy]
//
// Ability is initialised at 0.0 (mid-scale) and clamped to [-5, 5].

/** Learning rate for online ability estimation. */
const ABILITY_STEP = 0.1;

/** Hard bounds on the ability scale (logit scale). */
const ABILITY_MIN = -5;
const ABILITY_MAX = 5;

/**
 * Compute the probability of a correct answer given ability and difficulty.
 *
 * @param {number} ability    — student ability estimate (logit scale)
 * @param {number} difficulty — item difficulty (logit scale)
 * @returns {number} probability in [0, 1]
 */
export function pCorrect(ability, difficulty) {
    return 1 / (1 + Math.exp(-(ability - difficulty)));
}

/**
 * Update student ability based on a single response.
 *
 * @param {number}  currentAbility — current ability estimate
 * @param {boolean} isCorrect      — whether the student answered correctly
 * @param {number}  difficulty     — difficulty of the item just answered
 * @returns {number} updated ability estimate
 */
export function updateAbility(currentAbility, isCorrect, difficulty) {
    const p = pCorrect(currentAbility, difficulty);
    let newAbility;

    if (isCorrect) {
        // Reward — larger update for harder questions (high difficulty, low p)
        newAbility = currentAbility + ABILITY_STEP * (1 - p);
    } else {
        // Penalise — larger update for easier questions (low difficulty, high p)
        newAbility = currentAbility - ABILITY_STEP * p;
    }

    return clamp(newAbility, ABILITY_MIN, ABILITY_MAX);
}

/**
 * Convert a mastery probability (BKT output, 0-1) to an IRT difficulty value
 * on the logit scale.  This maps mastery → difficulty so that a question
 * calibrated to the student's current mastery level is chosen.
 *
 * Conceptually: if mastery ≈ 0.5, difficulty ≈ 0 (mid-scale).
 *
 * @param {number} mastery — probability in (0, 1)
 * @returns {number} difficulty in logit scale
 */
export function masteryToDifficulty(mastery) {
    // logit of mastery, clamped away from 0/1 to avoid ±Infinity
    const safe = clamp(mastery, 0.01, 0.99);
    return Math.log(safe / (1 - safe));
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
