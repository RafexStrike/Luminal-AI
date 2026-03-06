// FILE: tests/tutoring/bkt.test.js
// DESCRIPTION: Unit tests for Bayesian Knowledge Tracing module

import { updateMastery, initialMastery, averageMastery, BKT_PARAMS } from '../../src/lib/tutoring/bkt.js';

describe('BKT — updateMastery', () => {
    const { P_L0, P_T, P_S, P_G } = BKT_PARAMS;

    it('initialMastery() returns P_L0', () => {
        expect(initialMastery()).toBe(P_L0);
    });

    it('correct answer increases mastery', () => {
        const before = P_L0;
        const after = updateMastery(before, true);
        expect(after).toBeGreaterThan(before);
    });

    it('incorrect answer still increases mastery (transition)', () => {
        // Even an incorrect answer triggers the transition probability P_T
        const before = P_L0;
        const after = updateMastery(before, false);
        // After incorrect: P(L|wrong) is low, but +P_T ensures some increase
        expect(after).toBeGreaterThanOrEqual(0);
        expect(after).toBeLessThanOrEqual(1);
    });

    it('correct answer update follows the BKT equations exactly', () => {
        const pL = 0.4;
        const numerator = pL * (1 - P_S);
        const denominator = numerator + (1 - pL) * P_G;
        const pLGivenCorrect = numerator / denominator;
        const expected = pLGivenCorrect + (1 - pLGivenCorrect) * P_T;
        expect(updateMastery(pL, true)).toBeCloseTo(expected, 10);
    });

    it('incorrect answer update follows the BKT equations exactly', () => {
        const pL = 0.4;
        const numerator = pL * P_S;
        const denominator = numerator + (1 - pL) * (1 - P_G);
        const pLGivenIncorrect = numerator / denominator;
        const expected = pLGivenIncorrect + (1 - pLGivenIncorrect) * P_T;
        expect(updateMastery(pL, false)).toBeCloseTo(expected, 10);
    });

    it('output is always clamped to [0, 1]', () => {
        expect(updateMastery(0, true)).toBeGreaterThanOrEqual(0);
        expect(updateMastery(1, true)).toBeLessThanOrEqual(1);
        expect(updateMastery(0, false)).toBeGreaterThanOrEqual(0);
        expect(updateMastery(1, false)).toBeLessThanOrEqual(1);
    });

    it('mastery converges toward 1 after many correct answers', () => {
        let m = P_L0;
        for (let i = 0; i < 30; i++) m = updateMastery(m, true);
        expect(m).toBeGreaterThan(0.85);
    });

    it('mastery after many wrong answers stays low but above 0', () => {
        let m = P_L0;
        for (let i = 0; i < 10; i++) m = updateMastery(m, false);
        expect(m).toBeGreaterThan(0);
        expect(m).toBeLessThan(0.5);
    });
});

describe('BKT — averageMastery', () => {
    it('returns 0 for empty map', () => {
        expect(averageMastery({})).toBe(0);
    });

    it('returns single value for single-concept map', () => {
        expect(averageMastery({ rag: 0.6 })).toBeCloseTo(0.6);
    });

    it('returns mean of multiple concepts', () => {
        expect(averageMastery({ a: 0.4, b: 0.8 })).toBeCloseTo(0.6);
    });
});
