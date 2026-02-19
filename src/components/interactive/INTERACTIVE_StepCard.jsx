// FILE: src/components/interactive/INTERACTIVE_StepCard.jsx
// DESCRIPTION: Presentational component for a single interactive explainer step
// RESPONSIBILITY: Render one step card — nothing else.

'use client';

import React from 'react';

/**
 * @param {Object} props
 * @param {{ id: string, label: string, description: string, visual_state: string }} props.step
 * @param {boolean} props.isActive
 * @param {number}  props.stepNumber — 1-based display number
 */
export function INTERACTIVE_StepCard({ step, isActive, stepNumber }) {
    const stateColors = {
        idle: 'bg-gray-800/60 border-gray-700/60 text-gray-400',
        active: 'bg-purple-900/40 border-purple-500/60 text-purple-300',
        done: 'bg-emerald-900/30 border-emerald-600/50 text-emerald-400',
    };

    const stateDot = {
        idle: 'bg-gray-600',
        active: 'bg-purple-400 animate-pulse',
        done: 'bg-emerald-400',
    };

    const vsColor = stateColors[step.visual_state] || stateColors.idle;
    const dotColor = stateDot[step.visual_state] || stateDot.idle;

    return (
        <article
            aria-label={`Step ${stepNumber}: ${step.label}`}
            aria-current={isActive ? 'step' : undefined}
            className={`
        relative rounded-xl border p-4 transition-all duration-200
        ${vsColor}
        ${isActive ? 'ring-2 ring-purple-500/70 shadow-lg shadow-purple-900/30' : 'opacity-70 hover:opacity-90'}
      `}
        >
            {/* Step number badge */}
            <div className="flex items-center gap-3 mb-2">
                <span
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/80 text-xs font-bold text-gray-300 flex-shrink-0"
                    aria-hidden="true"
                >
                    {stepNumber}
                </span>
                <h3 className="text-sm font-semibold tracking-wide truncate">{step.label}</h3>
                <span className="ml-auto flex items-center gap-1.5 text-xs capitalize flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
                    {step.visual_state}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed pl-9">{step.description}</p>
        </article>
    );
}

export default INTERACTIVE_StepCard;
