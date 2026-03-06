// FILE: tests/tutoring/informationGain.test.js
// DESCRIPTION: Unit tests for entropy and information gain selection

import { entropy, expectedInfoGain, bestDifficulty } from '../../src/lib/tutoring/informationGain.js';

describe('entropy', () => {
    it('returns 1 at p=0.5 (maximum uncertainty)', () => {
        expect(entropy(0.5)).toBeCloseTo(1, 5);
    });

    it('returns 0 at p=0 (no uncertainty)', () => {
        expect(entropy(0)).toBe(0);
    });

    it('returns 0 at p=1 (no uncertainty)', () => {
        expect(entropy(1)).toBe(0);
    });

    it('is symmetric: H(p) = H(1-p)', () => {
        expect(entropy(0.2)).toBeCloseTo(entropy(0.8), 10);
        expect(entropy(0.3)).toBeCloseTo(entropy(0.7), 10);
    });

    it('is monotonically increasing toward 0.5 from both sides', () => {
        expect(entropy(0.4)).toBeGreaterThan(entropy(0.3));
        expect(entropy(0.4)).toBeGreaterThan(entropy(0.1));
    });

    it('matches -p*log2(p) - (1-p)*log2(1-p) for known values', () => {
        const p = 0.3;
        const expected = -(p * Math.log2(p)) - ((1 - p) * Math.log2(1 - p));
        expect(entropy(p)).toBeCloseTo(expected, 10);
    });
});

describe('expectedInfoGain', () => {
    it('is maximised when ability equals difficulty', () => {
        const ability = 1.5;
        // EIG at optimal vs off-optimal
        const optimal = expectedInfoGain(ability, ability);     // p=0.5 → EIG=1
        const offAbove = expectedInfoGain(ability, ability + 3); // p<0.5 → EIG<1
        const offBelow = expectedInfoGain(ability, ability - 3); // p>0.5 → EIG<1
        expect(optimal).toBeGreaterThan(offAbove);
        expect(optimal).toBeGreaterThan(offBelow);
    });

    it('returns a value in [0, 1]', () => {
        expect(expectedInfoGain(0, 0)).toBeGreaterThanOrEqual(0);
        expect(expectedInfoGain(0, 0)).toBeLessThanOrEqual(1);
        expect(expectedInfoGain(5, -5)).toBeGreaterThanOrEqual(0);
    });
});

describe('bestDifficulty', () => {
    it('returns ability when no candidates provided', () => {
        expect(bestDifficulty(2, [])).toBe(2);
        expect(bestDifficulty(2)).toBe(2);
    });

    it('returns the candidate closest to ability (maximises EIG)', () => {
        // ability = 1.0 — candidate 1.1 is closest → highest EIG
        const ability = 1.0;
        const candidates = [-2, -1, 0.5, 1.1, 3];
        const chosen = bestDifficulty(ability, candidates);
        expect(chosen).toBe(1.1);
    });

    it('handles single candidate', () => {
        expect(bestDifficulty(0, [5])).toBe(5);
    });
});
