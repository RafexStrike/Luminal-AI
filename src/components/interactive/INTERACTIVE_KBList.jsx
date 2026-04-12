// FILE: src/components/interactive/INTERACTIVE_KBList.jsx
// DESCRIPTION: Knowledge-base chunk list — render RAG-sourced snippets
// RESPONSIBILITY: Display KB items. Highlight selected item. That's all.

'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array<{ id: string, text: string }>} props.items
 * @param {(item: object) => void} [props.onItemClick]
 */
export function INTERACTIVE_KBList({ items = [], onItemClick }) {
    const [activeId, setActiveId] = useState(null);

    if (!items || items.length === 0) {
        return (
            <aside
                aria-label="Knowledge base"
                className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4 text-xs text-gray-500 italic"
            >
                No knowledge-base snippets for this explainer.
            </aside>
        );
    }

    function handleClick(item) {
        setActiveId(item.id);
        onItemClick?.(item);
    }

    return (
        <aside aria-label="Knowledge base snippets">
            <div className="flex items-center gap-2 mb-3">
                 <BookOpen className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Knowledge Base
                </span>
                <span className="ml-auto text-xs text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            <ul className="space-y-2" role="list">
                {items.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                        <li key={item.id}>
                            <button
                                type="button"
                                aria-pressed={isActive}
                                aria-label={`KB snippet ${item.id}`}
                                onClick={() => handleClick(item)}
                                className={`
                  w-full text-left rounded-lg border px-3 py-2.5 text-xs leading-relaxed transition-all duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                   ${isActive
                                         ? 'border-indigo-500/60 bg-indigo-900/30 text-indigo-200'
                                         : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:border-gray-600/70 hover:text-gray-300'
                                     }
                `}
                            >
                                 <span className="font-mono text-indigo-500 mr-1.5">[{item.id}]</span>
                                {item.text}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}

export default INTERACTIVE_KBList;
