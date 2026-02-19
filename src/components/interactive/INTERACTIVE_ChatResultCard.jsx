// FILE: src/components/interactive/INTERACTIVE_ChatResultCard.jsx
// DESCRIPTION: Chat-thread status card for a pending/success/failed interactive generation
// RESPONSIBILITY: Render one card in three possible states. Nothing more.

'use client';

import React from 'react';
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw, FileText } from 'lucide-react';

/**
 * @param {Object}   props
 * @param {'pending'|'success'|'error'} props.status
 * @param {string}   [props.title]            — Explainer title
 * @param {string}   [props.summary]          — Short summary (shown on success)
 * @param {string}   [props.errorMessage]     — Error message (shown on error)
 * @param {() => void} [props.onOpen]         — Open the full explainer
 * @param {() => void} [props.onViewSummary]  — View plain-text summary
 * @param {() => void} [props.onRetry]        — Re-trigger generation
 */
export function INTERACTIVE_ChatResultCard({
    status = 'pending',
    title = 'Interactive Explainer',
    summary,
    errorMessage,
    onOpen,
    onViewSummary,
    onRetry,
}) {
    console.log('INTERACTIVE: ChatResultCard rendered', { status, title });

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={`Interactive: ${title} — ${status}`}
            className={`
        rounded-xl border p-4 transition-all duration-200 w-full max-w-md
        ${status === 'pending' ? 'border-yellow-700/40 bg-yellow-900/10' : ''}
        ${status === 'success' ? 'border-purple-700/40 bg-purple-900/10' : ''}
        ${status === 'error' ? 'border-red-700/40   bg-red-900/10' : ''}
      `}
        >
            {/* ── Header row ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 mb-2">
                {status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-yellow-400 flex-shrink-0" aria-hidden="true" />}
                {status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />}
                {status === 'error' && <XCircle className="w-4 h-4 text-red-400   flex-shrink-0" aria-hidden="true" />}

                <span className="text-sm font-semibold text-white truncate">{title}</span>

                <span className={`
          ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0
          ${status === 'pending' ? 'bg-yellow-900/40 text-yellow-400' : ''}
          ${status === 'success' ? 'bg-emerald-900/40 text-emerald-400' : ''}
          ${status === 'error' ? 'bg-red-900/40 text-red-400' : ''}
        `}>
                    {status === 'pending' ? 'Generating…' : status}
                </span>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            {status === 'pending' && (
                <p className="text-xs text-gray-500 italic">Building your interactive explainer…</p>
            )}

            {status === 'success' && summary && (
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{summary}</p>
            )}

            {status === 'error' && errorMessage && (
                <p className="text-xs text-red-400/80 leading-relaxed mb-3">{errorMessage}</p>
            )}

            {/* ── Action buttons ─────────────────────────────────────────── */}
            {status === 'success' && (
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                        type="button"
                        aria-label="Open interactive explainer"
                        onClick={() => {
                            console.log('INTERACTIVE: Open clicked from ChatResultCard');
                            onOpen?.();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        Open
                    </button>

                    {onViewSummary && (
                        <button
                            type="button"
                            aria-label="View plain summary"
                            onClick={() => {
                                console.log('INTERACTIVE: View Summary clicked from ChatResultCard');
                                onViewSummary();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                            <FileText className="w-3 h-3" aria-hidden="true" />
                            View Summary
                        </button>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {onRetry && (
                        <button
                            type="button"
                            aria-label="Retry interactive generation"
                            onClick={() => {
                                console.log('INTERACTIVE: Retry clicked from ChatResultCard');
                                onRetry();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                            <RefreshCw className="w-3 h-3" aria-hidden="true" />
                            Retry
                        </button>
                    )}

                    {onViewSummary && (
                        <button
                            type="button"
                            aria-label="View plain explanation"
                            onClick={() => {
                                console.log('INTERACTIVE: View Plain Explanation clicked from ChatResultCard');
                                onViewSummary();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                            <FileText className="w-3 h-3" aria-hidden="true" />
                            View Plain Explanation
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default INTERACTIVE_ChatResultCard;
