// FILE: tests/interactive/INTERACTIVE_schema.test.js
// DESCRIPTION: Unit tests for INTERACTIVE_schema — valid/invalid spec assertions

import { validateInteractiveSpec, INTERACTIVE_SCHEMA } from '../../src/lib/interactive/INTERACTIVE_schema.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const VALID_SPEC = {
    type: 'interactive_explainer',
    version: '1.0',
    title: 'How RAG Works',
    summary: 'Step-through pipeline for RAG',
    steps: [
        { id: 'embed', label: 'Embed', description: 'Convert text to vectors', visual_state: 'idle' },
        { id: 'retrieve', label: 'Retrieve', description: 'Find nearest neighbours', visual_state: 'idle' },
    ],
    knowledge_base: [{ id: 'k1', text: 'RAG stands for Retrieval-Augmented Generation.' }],
    controls: { showNext: true, autoplay: false },
    assets: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema exports
// ─────────────────────────────────────────────────────────────────────────────

describe('INTERACTIVE_SCHEMA export', () => {
    it('exports a schema object with required fields', () => {
        expect(INTERACTIVE_SCHEMA).toBeDefined();
        expect(INTERACTIVE_SCHEMA.type).toBe('object');
        expect(Array.isArray(INTERACTIVE_SCHEMA.required)).toBe(true);
        expect(INTERACTIVE_SCHEMA.required).toContain('steps');
        expect(INTERACTIVE_SCHEMA.required).toContain('knowledge_base');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Valid specs
// ─────────────────────────────────────────────────────────────────────────────

describe('validateInteractiveSpec — valid inputs', () => {
    it('returns { valid: true } for a complete valid spec', () => {
        const { valid, errors } = validateInteractiveSpec(VALID_SPEC);
        expect(valid).toBe(true);
        expect(errors).toHaveLength(0);
    });

    it('accepts an empty knowledge_base array', () => {
        const spec = { ...VALID_SPEC, knowledge_base: [] };
        const { valid } = validateInteractiveSpec(spec);
        expect(valid).toBe(true);
    });

    it('accepts an empty assets object', () => {
        const spec = { ...VALID_SPEC, assets: {} };
        const { valid } = validateInteractiveSpec(spec);
        expect(valid).toBe(true);
    });

    it('accepts all three visual_state values', () => {
        for (const vs of ['idle', 'active', 'done']) {
            const spec = {
                ...VALID_SPEC,
                steps: [{ id: 's1', label: 'Step', description: 'Desc', visual_state: vs }],
            };
            const { valid } = validateInteractiveSpec(spec);
            expect(valid).toBe(true);
        }
    });

    it('accepts up to 10 steps', () => {
        const steps = Array.from({ length: 10 }, (_, i) => ({
            id: `s${i}`,
            label: `Step ${i}`,
            description: 'Desc',
            visual_state: 'idle',
        }));
        const { valid } = validateInteractiveSpec({ ...VALID_SPEC, steps });
        expect(valid).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Invalid specs & helpful error messages
// ─────────────────────────────────────────────────────────────────────────────

describe('validateInteractiveSpec — invalid inputs', () => {
    it('fails and returns errors for null', () => {
        const { valid, errors } = validateInteractiveSpec(null);
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails when type is wrong', () => {
        const { valid, errors } = validateInteractiveSpec({ ...VALID_SPEC, type: 'wrong_type' });
        expect(valid).toBe(false);
        expect(errors.some(e => e.includes('type'))).toBe(true);
    });

    it('fails when steps array is missing', () => {
        const { type, version, title, summary, knowledge_base, controls, assets } = VALID_SPEC;
        const { valid, errors } = validateInteractiveSpec({ type, version, title, summary, knowledge_base, controls, assets });
        expect(valid).toBe(false);
        expect(errors.some(e => e.toLowerCase().includes('steps') || e.includes("must have required property"))).toBe(true);
    });

    it('fails when steps array is empty', () => {
        const { valid, errors } = validateInteractiveSpec({ ...VALID_SPEC, steps: [] });
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails when a step is missing required fields', () => {
        const { valid, errors } = validateInteractiveSpec({
            ...VALID_SPEC,
            steps: [{ id: 's1', label: 'Label' }], // missing description & visual_state
        });
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails when visual_state is an invalid enum value', () => {
        const { valid, errors } = validateInteractiveSpec({
            ...VALID_SPEC,
            steps: [{ id: 's1', label: 'L', description: 'D', visual_state: 'unknown' }],
        });
        expect(valid).toBe(false);
        expect(errors.some(e => e.includes('visual_state'))).toBe(true);
    });

    it('fails when more than 5 knowledge_base items are provided', () => {
        const kbItems = Array.from({ length: 6 }, (_, i) => ({ id: `k${i}`, text: 'chunk' }));
        const { valid } = validateInteractiveSpec({ ...VALID_SPEC, knowledge_base: kbItems });
        expect(valid).toBe(false);
    });

    it('fails when version does not match semver pattern', () => {
        const { valid } = validateInteractiveSpec({ ...VALID_SPEC, version: 'v1' });
        expect(valid).toBe(false);
    });

    it('fails when extra top-level properties are added', () => {
        const { valid } = validateInteractiveSpec({ ...VALID_SPEC, extraProp: 'not allowed' });
        expect(valid).toBe(false);
    });

    it('returns helpful string error messages', () => {
        const { errors } = validateInteractiveSpec({ ...VALID_SPEC, steps: [] });
        errors.forEach(e => {
            expect(typeof e).toBe('string');
            expect(e.length).toBeGreaterThan(0);
        });
    });
});
