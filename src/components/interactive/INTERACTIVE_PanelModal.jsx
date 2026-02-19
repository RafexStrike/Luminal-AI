// FILE: src/components/interactive/INTERACTIVE_PanelModal.jsx
// DESCRIPTION: Panel listing all generated interactives with status badges and Open button
// RESPONSIBILITY: List UI panel only. Does not perform generation or rendering.

'use client';

import React from 'react';
import { Zap, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

const STATUS_CONFIG = {
    pending: {
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" aria-hidden="true" />,
        label: 'Generating…',
        labelClass: 'text-yellow-400',
        badgeClass: 'border-yellow-700/50 bg-yellow-900/20',
    },
    success: {
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />,
        label: 'Ready',
        labelClass: 'text-emerald-400',
        badgeClass: 'border-emerald-700/50 bg-emerald-900/20',
    },
    error: {
        icon: <XCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />,
        label: 'Failed',
        labelClass: 'text-red-400',
        badgeClass: 'border-red-700/50 bg-red-900/20',
    },
};

/**
 * @param {Object} props
 * @param {Array<{ id: string, title: string, status: 'pending'|'success'|'error', spec?: object }>} props.items
 * @param {(item: object) => void} [props.onOpen] — Called when user clicks Open on a ready item
 */
export function INTERACTIVE_PanelModal({ items = [], onOpen }) {
    console.log('INTERACTIVE: PanelModal rendering', { itemCount: items.length });

    if (items.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500"
                role="status"
                aria-label="No interactives generated yet"
            >
                <Zap className="w-8 h-8 text-gray-700" aria-hidden="true" />
                <p className="text-sm italic">No interactives yet. Type <code className="text-purple-400">@interactive</code> in the chat to generate one.</p>
            </div>
        );
    }

    return (
        <section aria-label="Generated interactives">
            <ul className="divide-y divide-gray-800/50" role="list">
                {items.map((item) => {
                    const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;

                    return (
                        <li
                            key={item.id}
                            className="flex items-center gap-3 py-3 px-1"
                        >
                            {/* Status badge */}
                            <span
                                aria-label={`Status: ${config.label}`}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${config.badgeClass} ${config.labelClass}`}
                            >
                                {config.icon}
                                {config.label}
                            </span>

                            {/* Title */}
                            <span className="flex-1 text-sm text-gray-200 truncate" title={item.title}>
                                {item.title}
                            </span>

                            {/* Open button — only for ready items */}
                            {item.status === 'success' && (
                                <button
                                    type="button"
                                    aria-label={`Open: ${item.title}`}
                                    onClick={() => {
                                        console.log('INTERACTIVE: Open clicked from PanelModal', { id: item.id, title: item.title });
                                        onOpen?.(item);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700/80 hover:bg-purple-600 text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                >
                                    Open
                                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

export default INTERACTIVE_PanelModal;
