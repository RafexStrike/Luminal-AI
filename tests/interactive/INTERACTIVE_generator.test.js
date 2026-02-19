// FILE: tests/interactive/INTERACTIVE_generator.test.js
// DESCRIPTION: Integration-style tests for INTERACTIVE_generator
// Mocks: HF client (getHfClient), RAG helper (fetchRAGSnippets)

// ── Mocks ─────────────────────────────────────────────────────────────────────

const VALID_SPEC_JSON = JSON.stringify({
    type: 'interactive_explainer',
    version: '1.0',
    title: 'How RAG Works',
    summary: 'Step-through pipeline for RAG',
    steps: [
        { id: 'embed', label: 'Embed', description: 'Convert text to vectors', visual_state: 'idle' },
    ],
    knowledge_base: [{ id: 'k1', text: 'RAG is Retrieval-Augmented Generation.' }],
    controls: { showNext: true, autoplay: false },
    assets: {},
});

// Mock hfClient
jest.mock('../../src/lib/hfClient.js', () => ({
    getHfClient: jest.fn(),
}));

// Mock ragHelper
jest.mock('../../src/lib/interactive/INTERACTIVE_ragHelper.js', () => ({
    fetchRAGSnippets: jest.fn().mockResolvedValue('[1] (note) Sample RAG context chunk…'),
}));

// Mock nanoid for deterministic IDs in logs
jest.mock('nanoid', () => ({ nanoid: () => 'TESTID01' }));

import { getHfClient } from '../../src/lib/hfClient.js';
import { generateInteractive } from '../../src/lib/interactive/INTERACTIVE_generator.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockClient(content) {
    return {
        chatCompletion: jest.fn().mockResolvedValue({
            choices: [{ message: { content } }],
        }),
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateInteractive — spec mode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns { kind: "spec", payload } when HF returns valid JSON', async () => {
        getHfClient.mockReturnValue(makeMockClient(VALID_SPEC_JSON));

        const result = await generateInteractive({
            query: '@interactive how RAG works',
            title: 'How RAG Works',
            mode: 'spec',
            userId: 'user-test-123',
        });

        expect(result.kind).toBe('spec');
        expect(result.payload).toMatchObject({
            type: 'interactive_explainer',
            title: 'How RAG Works',
        });
        expect(Array.isArray(result.payload.steps)).toBe(true);
        expect(result.payload.steps.length).toBeGreaterThanOrEqual(1);
    });

    it('calls chatCompletion with temperature 0.0', async () => {
        const mockClient = makeMockClient(VALID_SPEC_JSON);
        getHfClient.mockReturnValue(mockClient);

        await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'user-test-123',
        });

        const callArgs = mockClient.chatCompletion.mock.calls[0][0];
        expect(callArgs.temperature).toBe(0.0);
    });

    it('calls chatCompletion with the correct model', async () => {
        const mockClient = makeMockClient(VALID_SPEC_JSON);
        getHfClient.mockReturnValue(mockClient);

        await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'u1',
        });

        const callArgs = mockClient.chatCompletion.mock.calls[0][0];
        expect(callArgs.model).toBe('deepseek-ai/DeepSeek-V3.2');
    });

    it('returns { kind: "error" } when HF returns unparseable output', async () => {
        getHfClient.mockReturnValue(makeMockClient('This is not JSON at all!'));

        const result = await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'u1',
        });

        expect(result.kind).toBe('error');
        expect(result.payload.message).toMatch(/parse/i);
        expect(result.payload.debugHint).toContain('INTERACTIVE:');
    });

    it('recovers via postprocessing when model wraps JSON in markdown fences', async () => {
        const fenced = '```json\n' + VALID_SPEC_JSON + '\n```';
        getHfClient.mockReturnValue(makeMockClient(fenced));

        const result = await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'u1',
        });

        expect(result.kind).toBe('spec');
        expect(result.payload.type).toBe('interactive_explainer');
    });

    it('returns { kind: "error" } when spec fails schema validation', async () => {
        // Valid JSON but invalid spec (missing steps)
        const badSpec = JSON.stringify({ type: 'interactive_explainer', version: '1.0', title: 'X', summary: 'Y' });
        getHfClient.mockReturnValue(makeMockClient(badSpec));

        const result = await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'u1',
        });

        expect(result.kind).toBe('error');
        expect(result.payload.details.length).toBeGreaterThan(0);
    });

    it('returns { kind: "error" } when HF client throws', async () => {
        getHfClient.mockReturnValue({
            chatCompletion: jest.fn().mockRejectedValue(new Error('HF API timeout')),
        });

        const result = await generateInteractive({
            query: '@interactive test',
            title: 'Test',
            mode: 'spec',
            userId: 'u1',
        });

        expect(result.kind).toBe('error');
        expect(result.payload.message).toBeDefined();
    });
});
