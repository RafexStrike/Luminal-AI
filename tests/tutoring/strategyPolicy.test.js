// FILE: tests/tutoring/strategyPolicy.test.js
// DESCRIPTION: Unit tests for teaching strategy selection

import { selectStrategy, strategyLabel, STRATEGIES } from '../../src/lib/tutoring/strategyPolicy.js';

describe('selectStrategy', () => {
    it('returns prerequisite_review for mastery < 0.3', () => {
        expect(selectStrategy(0)).toBe('prerequisite_review');
        expect(selectStrategy(0.1)).toBe('prerequisite_review');
        expect(selectStrategy(0.29)).toBe('prerequisite_review');
    });

    it('returns scaffolding for mastery in [0.3, 0.5)', () => {
        expect(selectStrategy(0.3)).toBe('scaffolding');
        expect(selectStrategy(0.4)).toBe('scaffolding');
        expect(selectStrategy(0.499)).toBe('scaffolding');
    });

    it('returns socratic_questioning for mastery in [0.5, 0.7)', () => {
        expect(selectStrategy(0.5)).toBe('socratic_questioning');
        expect(selectStrategy(0.6)).toBe('socratic_questioning');
        expect(selectStrategy(0.699)).toBe('socratic_questioning');
    });

    it('returns challenge for mastery in [0.7, 0.9)', () => {
        expect(selectStrategy(0.7)).toBe('challenge');
        expect(selectStrategy(0.8)).toBe('challenge');
        expect(selectStrategy(0.899)).toBe('challenge');
    });

    it('returns synthesis for mastery >= 0.9', () => {
        expect(selectStrategy(0.9)).toBe('synthesis');
        expect(selectStrategy(0.95)).toBe('synthesis');
        expect(selectStrategy(1.0)).toBe('synthesis');
    });

    it('returns values that are all members of STRATEGIES', () => {
        const testValues = [0, 0.15, 0.35, 0.55, 0.75, 0.95];
        for (const m of testValues) {
            expect(STRATEGIES).toContain(selectStrategy(m));
        }
    });
});

describe('strategyLabel', () => {
    it('returns a non-empty string for every valid strategy', () => {
        for (const s of STRATEGIES) {
            const label = strategyLabel(s);
            expect(typeof label).toBe('string');
            expect(label.length).toBeGreaterThan(0);
        }
    });

    it('returns the strategy name itself for unknown strategies', () => {
        expect(strategyLabel('unknown_strategy')).toBe('unknown_strategy');
    });
});
