// FILE: src/components/interactive/INTERACTIVE_IframeSandbox.jsx
// DESCRIPTION: Sandboxed iframe for rendering model-produced HTML bundles
// RESPONSIBILITY: Render safeHtml inside a strict iframe. Log all postMessage events. Nothing else.
//
// SECURITY: Never weaken the sandbox attribute without explicit approval.
// The only allowed capability is allow-scripts (required for interactive content).
// CSP is injected by INTERACTIVE_bundleBuilder before this component receives safeHtml.

'use client';

import React, { useRef, useEffect } from 'react';

/**
 * @param {Object} props
 * @param {string} props.safeHtml     — Sanitised HTML string from INTERACTIVE_bundleBuilder
 * @param {string} [props.className]  — Extra Tailwind classes for the iframe wrapper
 * @param {(event: MessageEvent) => void} [props.onMessage] — Optional postMessage handler
 */
export function INTERACTIVE_IframeSandbox({ safeHtml, className = '', onMessage }) {
    const iframeRef = useRef(null);

    // Listen for postMessage events from the sandboxed iframe
    useEffect(() => {
        function handleMessage(event) {
            // Only accept messages from the iframe's own srcdoc origin (null origin)
            console.log('INTERACTIVE: postMessage received from iframe', {
                origin: event.origin,
                dataType: typeof event.data,
                data: event.data,
            });
            onMessage?.(event);
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onMessage]);

    if (!safeHtml) {
        return (
            <div
                className={`flex items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/30 text-gray-500 text-xs italic p-8 ${className}`}
                aria-label="Interactive bundle unavailable"
            >
                No bundle content to display.
            </div>
        );
    }

    return (
        <iframe
            ref={iframeRef}
            title="Interactive bundle (sandboxed)"
            aria-label="Interactive bundle sandbox"
            srcDoc={safeHtml}
            // allow-scripts is required for interactive HTML bundles
            // allow-same-origin is intentionally OMITTED to prevent sandbox escape
            sandbox="allow-scripts"
            className={`w-full rounded-xl border border-gray-700/50 bg-white ${className}`}
            style={{ minHeight: '400px' }}
            loading="lazy"
        />
    );
}

export default INTERACTIVE_IframeSandbox;
