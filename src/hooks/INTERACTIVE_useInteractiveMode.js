// FILE: src/hooks/INTERACTIVE_useInteractiveMode.js
// DESCRIPTION: Detects @interactive token, performs API call, manages lifecycle state
// RESPONSIBILITY: Hook API surface — detection, generation, cancel, state. Nothing visual.

'use client';

import { useState, useCallback, useRef } from 'react';

const TRIGGER_TOKEN = '@interactive';
const API_ENDPOINT = '/api/interactive/generate';

/**
 * Detect `@interactive` in composer text, call the generation API, manage state.
 *
 * @param {string} [composerText] — Live text from the chat composer
 * @returns {{
 *   isInteractiveQuery: boolean,
 *   status: 'idle'|'pending'|'success'|'error',
 *   result: object|null,
 *   generate: (params: { query: string, title: string, mode?: string }) => Promise<void>,
 *   cancel: () => void,
 *   reset: () => void,
 * }}
 */
export function INTERACTIVE_useInteractiveMode(composerText = '') {
    const [status, setStatus] = useState('idle');   // 'idle' | 'pending' | 'success' | 'error'
    const [result, setResult] = useState(null);      // { kind, payload } from API

    // Abort controller ref — allows in-flight cancellation
    const abortRef = useRef(null);

    // ── Detection ────────────────────────────────────────────────────────
    const isInteractiveQuery =
        typeof composerText === 'string' &&
        composerText.toLowerCase().includes(TRIGGER_TOKEN);

    if (isInteractiveQuery && composerText.trim().startsWith(TRIGGER_TOKEN)) {
        // Log trigger detection (only when text first contains token; avoids spam)
        // Actual logging is done once inside generate() to avoid re-render noise
    }

    // ── Generate ─────────────────────────────────────────────────────────
    const generate = useCallback(async ({ query, title, mode = 'spec' }) => {
        console.log('INTERACTIVE: detected trigger — api call starting', { query, title, mode });
        setStatus('pending');
        setResult(null);

        // Create fresh abort controller
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, title, mode }),
                signal: controller.signal,
            });

            const data = await res.json();
            console.log('INTERACTIVE: api call resolved', { kind: data.kind, status: res.status });

            if (data.kind === 'error') {
                console.error('INTERACTIVE ERROR: api returned error payload', data.payload);
                setStatus('error');
                setResult(data);
            } else {
                setStatus('success');
                setResult(data);
                console.log('INTERACTIVE: generation succeeded', { kind: data.kind });
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('INTERACTIVE: api call cancelled by user');
                setStatus('idle');
                setResult(null);
            } else {
                console.error('INTERACTIVE ERROR: api call threw', err);
                setStatus('error');
                setResult({
                    kind: 'error',
                    payload: { message: err.message, details: [], debugHint: '' },
                });
            }
        } finally {
            abortRef.current = null;
        }
    }, []);

    // ── Cancel ───────────────────────────────────────────────────────────
    const cancel = useCallback(() => {
        if (abortRef.current) {
            console.log('INTERACTIVE: cancelling in-flight api call');
            abortRef.current.abort();
        }
    }, []);

    // ── Reset to idle ─────────────────────────────────────────────────────
    const reset = useCallback(() => {
        cancel();
        setStatus('idle');
        setResult(null);
        console.log('INTERACTIVE: hook state reset');
    }, [cancel]);

    return { isInteractiveQuery, status, result, generate, cancel, reset };
}
