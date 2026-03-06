// FILE: src/lib/tutoring/informationGain.js
// DESCRIPTION: Information-gain based question selection
// RESPONSIBILITY: Pure functions — entropy, expected information gain, best difficulty.
//
// Shannon entropy:
//   H(p) = -p·log2(p) - (1-p)·log2(1-p)
//   H is maximised at p = 0.5 (one bit of uncertainty) and 0 at p ∈ {0, 1}.
//
// Expected information gain for a question with P(correct) = p:
//   EIG(p) = H(p)  [posterior entropy is 0 in the 1-D Bernoulli case;
//                   maximising prior entropy maximises the gain]
//
// Optimal question difficulty: set difficulty = ability so P(correct) = 0.5,
// which maximises H and therefore expected information gain.

import { pCorrect } from './irt.js';

/**
 * Compute binary Shannon entropy H(p).
 * Returns 0 for degenerate inputs (p = 0 or p = 1).
 *
 * @param {number} p — probability in [0, 1]
 * @returns {number} entropy in bits [0, 1]
 */
export function entropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -(p * Math.log2(p)) - ((1 - p) * Math.log2(1 - p));
}

/**
 * Compute expected information gain for a question at a given difficulty level,
 * given the student's current ability estimate.
 *
 * EIG = H(P(correct | ability, difficulty))
 *
 * @param {number} ability    — student ability (logit)
 * @param {number} difficulty — item difficulty (logit)
 * @returns {number} EIG in bits [0, 1]
 */
export function expectedInfoGain(ability, difficulty) {
    const p = pCorrect(ability, difficulty);
    return entropy(p);
}

/**
 * From a set of candidate difficulty values, pick the one that maximises
 * expected information gain given the student's current ability.
 *
 * If no candidates are provided, returns `ability` itself — at which point
 * P(correct) = 0.5 and entropy is maximised (1 bit).
 *
 * @param {number}   ability    — student ability estimate (logit)
 * @param {number[]} [candidates] — array of difficulty values to evaluate
 * @returns {number} difficulty that maximises EIG
 */
export function bestDifficulty(ability, candidates) {
    if (!candidates || candidates.length === 0) {
        // Optimal difficulty = ability → P(correct) = 0.5 → max entropy
        return ability;
    }

    let best = candidates[0];
    let bestEIG = expectedInfoGain(ability, candidates[0]);

    for (let i = 1; i < candidates.length; i++) {
        const eig = expectedInfoGain(ability, candidates[i]);
        if (eig > bestEIG) {
            bestEIG = eig;
            best = candidates[i];
        }
    }

    return best;
}
