// FILE: tests/tutoring/irt.test.js
// DESCRIPTION: Unit tests for Item Response Theory module

import { pCorrect, updateAbility, masteryToDifficulty } from '../../src/lib/tutoring/irt.js';

describe('IRT — pCorrect', () => {
    it('returns 0.5 when ability equals difficulty (no difference)', () => {
        expect(pCorrect(0, 0)).toBeCloseTo(0.5);
        expect(pCorrect(1, 1)).toBeCloseTo(0.5);
    });

    it('returns > 0.5 when ability exceeds difficulty', () => {
        expect(pCorrect(2, 0)).toBeGreaterThan(0.5);
    });

    it('returns < 0.5 when difficulty exceeds ability', () => {
        expect(pCorrect(0, 2)).toBeLessThan(0.5);
    });

    it('output is always in (0, 1)', () => {
        expect(pCorrect(10, -10)).toBeLessThan(1);
        expect(pCorrect(-10, 10)).toBeGreaterThan(0);
    });

    it('follows 1 / (1 + exp(-(a-d))) exactly', () => {
        const a = 1.5, d = 0.5;
        const expected = 1 / (1 + Math.exp(-(a - d)));
        expect(pCorrect(a, d)).toBeCloseTo(expected, 10);
    });
});

describe('IRT — updateAbility', () => {
    it('increases ability after a correct answer', () => {
        const before = 0;
        const after = updateAbility(before, true, 0);
        expect(after).toBeGreaterThan(before);
    });

    it('decreases ability after an incorrect answer', () => {
        const before = 0;
        const after = updateAbility(before, false, 0);
        expect(after).toBeLessThan(before);
    });

    it('correct on easy question produces smaller increase than correct on hard', () => {
        const a = 0;
        const easyDiff = -3; // student should find this easy → small reward
        const hardDiff = 3; // student should find this hard → bigger reward
        const increaseEasy = updateAbility(a, true, easyDiff) - a;
        const increaseHard = updateAbility(a, true, hardDiff) - a;
        expect(increaseHard).toBeGreaterThan(increaseEasy);
    });

    it('ability is clamped to [-5, 5]', () => {
        let a = 5;
        a = updateAbility(a, true, -10);
        expect(a).toBeLessThanOrEqual(5);

        let b = -5;
        b = updateAbility(b, false, 10);
        expect(b).toBeGreaterThanOrEqual(-5);
    });
});

describe('IRT — masteryToDifficulty', () => {
    it('maps mastery=0.5 to difficulty≈0', () => {
        expect(masteryToDifficulty(0.5)).toBeCloseTo(0, 5);
    });

    it('maps mastery<0.5 to negative difficulty', () => {
        expect(masteryToDifficulty(0.2)).toBeLessThan(0);
    });

    it('maps mastery>0.5 to positive difficulty', () => {
        expect(masteryToDifficulty(0.8)).toBeGreaterThan(0);
    });

    it('handles boundary values without throwing', () => {
        expect(() => masteryToDifficulty(0)).not.toThrow();
        expect(() => masteryToDifficulty(1)).not.toThrow();
    });
});
