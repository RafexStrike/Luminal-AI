// FILE: src/lib/interactive/INTERACTIVE_schema.js
// DESCRIPTION: AJV schema + validation for Socratic session specs
// RESPONSIBILITY: Single-purpose validator — validates one kind of object and reports errors clearly.
//
// SCHEMA: socratic_session
//   type         — always "socratic_session"
//   version      — semver string e.g. "1.0"
//   topic        — the topic being explored
//   intro        — one welcoming sentence to open the session
//   turns[]      — array of dialogue turns (1–6):
//     id          — unique turn id
//     question    — Socratic question to ask the learner
//     hint        — gentle nudge if they're stuck
//     concepts[]  — 1-3 key concepts this turn surfaces
//     viz_type    — one of the predefined animation types
//     viz_config  — arbitrary JSON config for the chosen viz

import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * JSON Schema for an Interactive Explainer spec.
 *
 * Fields:
 *   type           — always "interactive_explainer"
 *   version        — semver string e.g. "1.0"
 *   title          — human-readable title
 *   summary        — one-line summary
 *   steps[]        — ordered list of steps (1–10)
 *   knowledge_base[] — RAG chunks surfaced to the user (0–5)
 *   controls{}     — UI control flags
 *   assets{}       — optional arbitrary assets map
 */
// VIZ_TYPES: predefined animated visualization types the LLM may pick
export const INTERACTIVE_VIZ_TYPES = [
    'nodes_forming',     // Neurons/nodes appearing and linking up
    'data_flowing',      // Particles travelling along a path
    'layers_stacking',   // Horizontal layers animating in
    'concept_branching', // Mind-map branches expanding
    'comparison',        // Two columns building side-by-side
    'process_steps',     // Sequential steps appearing with arrows
];

export const INTERACTIVE_SCHEMA = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['type', 'version', 'topic', 'intro', 'turns'],
    additionalProperties: false,
    properties: {
        type: {
            type: 'string',
            const: 'socratic_session',
        },
        version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
        },
        topic: { type: 'string', minLength: 1, maxLength: 200 },
        intro: { type: 'string', minLength: 1, maxLength: 400 },
        turns: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: {
                type: 'object',
                required: ['id', 'question', 'hint', 'concepts', 'viz_type', 'viz_config'],
                additionalProperties: false,
                properties: {
                    id: { type: 'string', minLength: 1 },
                    question: { type: 'string', minLength: 10, maxLength: 400 },
                    hint: { type: 'string', minLength: 1, maxLength: 250 },
                    concepts: {
                        type: 'array',
                        minItems: 1,
                        maxItems: 3,
                        items: { type: 'string', minLength: 1, maxLength: 60 },
                    },
                    viz_type: {
                        type: 'string',
                        enum: INTERACTIVE_VIZ_TYPES,
                    },
                    viz_config: { type: 'object' },
                },
            },
        },
    },
};

// Compile once for reuse
const _validate = ajv.compile(INTERACTIVE_SCHEMA);

/**
 * Validate a socratic session spec against the AJV schema.
 *
 * @param {unknown} obj — the object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateInteractiveSpec(obj) {
    console.log('INTERACTIVE: validateInteractiveSpec called', {
        type: typeof obj,
        keys: obj && typeof obj === 'object' ? Object.keys(obj) : [],
    });

    const valid = _validate(obj);

    if (valid) {
        console.log('INTERACTIVE: spec validation passed');
        return { valid: true, errors: [] };
    }

    const errors = (_validate.errors || []).map((err) => {
        const path = err.instancePath || '(root)';
        return `${path}: ${err.message}`;
    });

    console.error('INTERACTIVE ERROR: spec validation failed', { errors, obj });
    return { valid: false, errors };
}
