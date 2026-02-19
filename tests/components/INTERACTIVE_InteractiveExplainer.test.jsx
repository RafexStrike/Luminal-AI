// FILE: tests/components/INTERACTIVE_InteractiveExplainer.test.jsx
// DESCRIPTION: Component tests for INTERACTIVE_InteractiveExplainer
// Tests: renders title, step count, step labels, navigation buttons work

/**
 * Installation required (if not already present):
 *   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
 *
 * To run:
 *   npx jest tests/components/INTERACTIVE_InteractiveExplainer.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { INTERACTIVE_InteractiveExplainer } from '../../src/components/interactive/INTERACTIVE_InteractiveExplainer';

// Hardcoded sample spec for tests
const SAMPLE_SPEC = {
    type: 'interactive_explainer',
    version: '1.0',
    title: 'How RAG Works',
    summary: 'A step-through pipeline for Retrieval-Augmented Generation.',
    steps: [
        { id: 'step1', label: 'Embed Query', description: 'Convert the user query to a vector.', visual_state: 'active' },
        { id: 'step2', label: 'Retrieve', description: 'Find top-K nearest neighbour chunks.', visual_state: 'idle' },
        { id: 'step3', label: 'Augment', description: 'Inject retrieved chunks into the prompt.', visual_state: 'idle' },
    ],
    knowledge_base: [
        { id: 'k1', text: 'RAG stands for Retrieval-Augmented Generation.' },
        { id: 'k2', text: 'Embeddings map text into a high-dimensional space.' },
    ],
    controls: { showNext: true, autoplay: false },
    assets: {},
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderExplainer(overrides = {}) {
    return render(<INTERACTIVE_InteractiveExplainer spec={{ ...SAMPLE_SPEC, ...overrides }} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('INTERACTIVE_InteractiveExplainer', () => {
    describe('Rendering', () => {
        it('renders the spec title', () => {
            renderExplainer();
            expect(screen.getByText('How RAG Works')).toBeInTheDocument();
        });

        it('renders the spec summary', () => {
            renderExplainer();
            expect(screen.getByText(SAMPLE_SPEC.summary)).toBeInTheDocument();
        });

        it('renders all step labels', () => {
            renderExplainer();
            SAMPLE_SPEC.steps.forEach((step) => {
                expect(screen.getByText(step.label)).toBeInTheDocument();
            });
        });

        it('renders correct count of step cards', () => {
            renderExplainer();
            // Each step has an article with a step number badge
            const articles = screen.getAllByRole('article');
            expect(articles).toHaveLength(SAMPLE_SPEC.steps.length);
        });

        it('renders KB items', () => {
            renderExplainer();
            expect(screen.getByText(SAMPLE_SPEC.knowledge_base[0].text)).toBeInTheDocument();
        });

        it('renders Prev and Next navigation buttons', () => {
            renderExplainer();
            expect(screen.getByRole('button', { name: /previous step/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
        });

        it('shows null-safe fallback when spec prop is null', () => {
            render(<INTERACTIVE_InteractiveExplainer spec={null} />);
            expect(screen.getByText(/no spec provided/i)).toBeInTheDocument();
        });
    });

    describe('Step navigation', () => {
        it('Prev button is disabled on the first step', () => {
            renderExplainer();
            const prevBtn = screen.getByRole('button', { name: /previous step/i });
            expect(prevBtn).toBeDisabled();
        });

        it('Next button is enabled on the first step', () => {
            renderExplainer();
            const nextBtn = screen.getByRole('button', { name: /next step/i });
            expect(nextBtn).not.toBeDisabled();
        });

        it('clicking Next advances the step counter', () => {
            renderExplainer();
            const nextBtn = screen.getByRole('button', { name: /next step/i });

            // Initially: "1 / 3"
            expect(screen.getByText('1 / 3')).toBeInTheDocument();

            fireEvent.click(nextBtn);

            // After one click: "2 / 3"
            expect(screen.getByText('2 / 3')).toBeInTheDocument();
        });

        it('clicking Next then Prev returns to original step', () => {
            renderExplainer();
            const nextBtn = screen.getByRole('button', { name: /next step/i });
            const prevBtn = screen.getByRole('button', { name: /previous step/i });

            fireEvent.click(nextBtn);
            fireEvent.click(prevBtn);

            expect(screen.getByText('1 / 3')).toBeInTheDocument();
        });

        it('Next button is disabled on the last step', () => {
            renderExplainer();
            const nextBtn = screen.getByRole('button', { name: /next step/i });

            // Click through to last step
            fireEvent.click(nextBtn);
            fireEvent.click(nextBtn);

            expect(nextBtn).toBeDisabled();
        });

        it('calls onClose when ESC is pressed', () => {
            const onClose = jest.fn();
            render(<INTERACTIVE_InteractiveExplainer spec={SAMPLE_SPEC} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility', () => {
        it('root element has role="dialog"', () => {
            renderExplainer();
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('dialog has descriptive aria-label', () => {
            renderExplainer();
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-label', expect.stringContaining('How RAG Works'));
        });

        it('step counter has aria-live attribute', () => {
            renderExplainer();
            const counter = screen.getByText('1 / 3');
            expect(counter).toHaveAttribute('aria-live', 'polite');
        });
    });
});
