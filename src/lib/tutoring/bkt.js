// FILE: src/lib/tutoring/bkt.js
// DESCRIPTION: Bayesian Knowledge Tracing — mastery probability updates
// RESPONSIBILITY: Pure function — update mastery given a correctness signal.
//
// Model parameters (Anderson & Corbett standard defaults):
//   P_L0 = 0.2  — prior probability student already knows the skill
//   P_T  = 0.15 — probability of learning (transition) on each opportunity
//   P_S  = 0.1  — probability of slip (knows it but answers wrong)
//   P_G  = 0.2  — probability of guess (doesn't know but answers correctly)
//
// Update equations:
//
//   CORRECT:
//     P(L_t | correct) = P(L)*(1-P_S) / [P(L)*(1-P_S) + (1-P(L))*P_G]
//     P(L_{t+1})       = P(L_t|correct) + (1 - P(L_t|correct)) * P_T
//
//   INCORRECT:
//     P(L_t | incorrect) = P(L)*P_S / [P(L)*P_S + (1-P(L))*(1-P_G)]
//     P(L_{t+1})         = P(L_t|incorrect) + (1 - P(L_t|incorrect)) * P_T

/** BKT fixed parameters. */
export const BKT_PARAMS = {
    P_L0: 0.2,
    P_T: 0.15,
    P_S: 0.1,
    P_G: 0.2,
};

/**
 * Update a mastery probability estimate using one observation.
 *
 * @param {number} currentMastery — P(L_t), current mastery probability [0, 1]
 * @param {boolean} isCorrect     — whether the student answered correctly
 * @returns {number} P(L_{t+1}), updated mastery probability [0, 1]
 */
export function updateMastery(currentMastery, isCorrect) {
    const { P_T, P_S, P_G } = BKT_PARAMS;
    const pL = clamp(currentMastery, 0, 1);

    let pLGivenObs;

    if (isCorrect) {
        // P(L_t | correct) = P(L)*(1-P_S) / [P(L)*(1-P_S) + (1-P(L))*P_G]
        const numerator = pL * (1 - P_S);
        const denominator = numerator + (1 - pL) * P_G;
        pLGivenObs = denominator > 0 ? numerator / denominator : pL;
    } else {
        // P(L_t | incorrect) = P(L)*P_S / [P(L)*P_S + (1-P(L))*(1-P_G)]
        const numerator = pL * P_S;
        const denominator = numerator + (1 - pL) * (1 - P_G);
        pLGivenObs = denominator > 0 ? numerator / denominator : pL;
    }

    // Transition: P(L_{t+1}) = P(L_t|obs) + (1 - P(L_t|obs)) * P_T
    const newMastery = pLGivenObs + (1 - pLGivenObs) * P_T;

    return clamp(newMastery, 0, 1);
}

/**
 * Initialise mastery for a new concept using P_L0.
 * Convenience export so callers don't need to import BKT_PARAMS separately.
 * @returns {number}
 */
export function initialMastery() {
    return BKT_PARAMS.P_L0;
}

/**
 * Compute the average mastery across all tracked concepts.
 * @param {Object} masteryMap — { conceptName: probability, ... }
 * @returns {number} average mastery [0, 1], or 0 if no concepts tracked
 */
export function averageMastery(masteryMap) {
    const values = Object.values(masteryMap);
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
