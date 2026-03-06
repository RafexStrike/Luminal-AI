// FILE: src/components/interactive/INTERACTIVE_InteractiveExplainer.jsx
// DESCRIPTION: Socratic teaching UI — progressive dialogue with animated visualizations.
// One turn at a time: show Socratic question + animation, accept user's response, advance.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { INTERACTIVE_AnimatedViz } from './INTERACTIVE_AnimatedViz';

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ total, current }) {
    return (
        <div className="flex items-center gap-2 justify-center" aria-label={`Turn ${current + 1} of ${total}`}>
            {Array.from({ length: total }, (_, i) => (
                <div key={i} className={`rounded-full transition-all duration-400 ${i < current ? 'w-2 h-2 bg-purple-500' :
                    i === current ? 'w-3 h-3 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)]' :
                        'w-2 h-2 bg-gray-700'
                    }`} />
            ))}
        </div>
    );
}

// ─── Concept tags ─────────────────────────────────────────────────────────────
function ConceptTags({ concepts = [] }) {
    if (!concepts.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-3">
            {concepts.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/40 border border-purple-500/40 text-purple-300">
                    {c}
                </span>
            ))}
        </div>
    );
}

// ─── Hint toggle ──────────────────────────────────────────────────────────────
function HintToggle({ hint }) {
    const [open, setOpen] = useState(false);
    if (!hint) return null;
    return (
        <div className="mt-3">
            <button
                onClick={() => setOpen(o => !o)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 rounded"
                aria-expanded={open}
            >
                <span>{open ? '▾' : '▸'}</span>
                {open ? 'Hide hint' : 'Need a hint?'}
            </button>
            {open && (
                <p className="mt-1.5 text-sm text-gray-400 italic border-l-2 border-purple-700 pl-3">
                    {hint}
                </p>
            )}
        </div>
    );
}

// ─── User response history card ───────────────────────────────────────────────
function ResponseHistory({ turns, responses }) {
    if (!responses.length) return null;
    return (
        <div className="mt-4 space-y-2">
            {responses.map((resp, i) => (
                <div key={i} className="rounded-lg bg-gray-900/60 border border-gray-700/50 px-3 py-2">
                    <p className="text-gray-500 text-xs mb-0.5">Q{i + 1}: {turns[i]?.question?.slice(0, 60)}…</p>
                    <p className="text-gray-300 text-sm">→ {resp}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ topic, turns, responses, onClose, onRestart }) {
    return (
        <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-900/60 border-2 border-purple-500 flex items-center justify-center text-4xl shadow-[0_0_24px_rgba(168,85,247,0.4)]">
                🧠
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Session Complete!</h2>
                <p className="text-gray-400 text-sm">You explored <span className="text-purple-300 font-semibold">{topic}</span> through {turns.length} Socratic turns.</p>
            </div>

            {/* Journey summary */}
            <div className="w-full max-w-lg space-y-2 text-left">
                {turns.map((turn, i) => (
                    <div key={i} className="rounded-lg bg-gray-900/60 border border-gray-700/50 px-3 py-2">
                        <div className="flex gap-2 items-start">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                            <div>
                                <p className="text-gray-400 text-xs">{turn.question}</p>
                                {responses[i] && <p className="text-purple-300 text-xs mt-0.5 font-medium">Your answer: {responses[i]}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={onRestart}
                    className="px-5 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-900/40 transition-colors text-sm font-medium">
                    ↺ Restart
                </button>
                <button onClick={onClose}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 transition-all text-sm font-medium shadow-lg shadow-purple-500/30">
                    Done
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {Object} props.spec    — Validated socratic_session spec from the LLM
 * @param {Function} props.onClose — Callback to close the modal
 */
export function INTERACTIVE_InteractiveExplainer({ spec, onClose }) {
    const [turns, setTurns] = useState(spec?.turns || []);
    const [turnIdx, setTurnIdx] = useState(0);
    const [input, setInput] = useState('');
    const [responses, setResponses] = useState([]);
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mastery, setMastery] = useState(spec?.initialMastery || 0.2);
    const [animKey, setAnimKey] = useState(0); // remount viz on turn change
    const inputRef = useRef(null);

    const currentTurn = turns[turnIdx];

    // Focus input when turn changes
    useEffect(() => {
        inputRef.current?.focus();
        setAnimKey(k => k + 1);
    }, [turnIdx]);

    // ESC to close
    useEffect(() => {
        const handler = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = useCallback(async () => {
        if (!input.trim() || loading || !spec?.sessionId) return;

        const studentAnswer = input.trim();
        const nextResponses = [...responses, studentAnswer];
        setResponses(nextResponses);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/interactive/nextStep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: spec.sessionId,
                    studentAnswer,
                }),
            });

            const data = await res.json();

            if (data.terminated) {
                setDone(true);
                if (data.updatedMastery) setMastery(data.updatedMastery);
                return;
            }

            // Append new turn to local state
            const newTurn = {
                id: `t-${Date.now()}`,
                question: data.nextQuestion,
                hint: data.hint,
                concepts: data.concepts || [spec.topic],
                viz_type: data.viz_type || 'process_steps',
                viz_config: {},
            };

            setTurns(prev => [...prev.slice(0, turnIdx + 1), newTurn]);
            setTurnIdx(t => t + 1);
            if (data.updatedMastery) setMastery(data.updatedMastery);

        } catch (err) {
            console.error('INTERACTIVE ERROR: failed to fetch next step', err);
            // Fallback for UI if API fails – just advance to next pre-generated turn if exists
            if (turnIdx < turns.length - 1) {
                setTurnIdx(t => t + 1);
            } else {
                setDone(true);
            }
        } finally {
            setLoading(false);
        }
    }, [input, responses, turnIdx, turns, spec, loading]);

    const handleRestart = () => {
        setTurnIdx(0);
        setTurns(spec?.turns || []);
        setResponses([]);
        setMastery(spec?.initialMastery || 0.2);
        setInput('');
        setDone(false);
        setAnimKey(k => k + 1);
    };

    if (!spec) return null;

    return (
        <div
            className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={`Socratic session: ${spec.topic}`}
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70 bg-gradient-to-r from-gray-950 to-purple-950/20">
                <div className="flex items-center gap-2">
                    <span className="text-purple-400 text-lg" aria-hidden>🎓</span>
                    <div>
                        <h2 className="text-white font-bold text-base leading-tight">{spec.topic}</h2>
                        <p className="text-gray-500 text-xs">Socratic exploration</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    aria-label="Close session"
                >✕</button>
            </div>

            {done ? (
                <CompletionScreen
                    topic={spec.topic}
                    turns={turns}
                    responses={responses}
                    onClose={onClose}
                    onRestart={handleRestart}
                />
            ) : (
                <div className="flex flex-col gap-0">
                    {/* ── Animated Visualization ── */}
                    <div
                        key={`viz-${animKey}`}
                        className="w-full bg-gray-950/60 border-b border-gray-800/60"
                        style={{ height: '200px' }}
                        aria-label="Animated concept visualization"
                    >
                        <INTERACTIVE_AnimatedViz
                            vizType={currentTurn?.viz_type}
                            vizConfig={currentTurn?.viz_config || {}}
                            className="h-full p-2"
                        />
                    </div>

                    {/* ── Dialogue body ── */}
                    <div className="px-5 py-4 flex flex-col gap-3">
                        {/* Progress */}
                        <div className="flex items-center justify-between">
                            <ProgressDots total={turns.length} current={turnIdx} />
                            <span className="text-gray-600 text-xs">Turn {turnIdx + 1} / {turns.length}</span>
                        </div>

                        {/* Intro (first turn only) */}
                        {turnIdx === 0 && spec.intro && (
                            <p className="text-purple-300/80 text-sm italic border-l-2 border-purple-700 pl-3">
                                {spec.intro}
                            </p>
                        )}

                        {/* Socratic question */}
                        <div className="rounded-xl bg-gray-900/60 border border-purple-900/50 p-4">
                            <p className="text-white text-base leading-relaxed font-medium">
                                {currentTurn?.question}
                            </p>
                            <ConceptTags concepts={currentTurn?.concepts} />
                            <HintToggle hint={currentTurn?.hint} />
                        </div>

                        {/* Previous responses (collapsible, last 2) */}
                        {responses.length > 0 && (
                            <ResponseHistory
                                turns={turns.slice(0, responses.length)}
                                responses={responses.slice(-2)}
                            />
                        )}

                        {/* User input */}
                        <div className="flex gap-2 mt-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                disabled={loading}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                                }}
                                placeholder={loading ? "Thinking..." : "Share your thinking… (Enter to continue)"}
                                rows={2}
                                className={`flex-1 bg-gray-900/70 border border-gray-700/60 focus:border-purple-500/70 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 resize-none outline-none transition-colors focus:bg-gray-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label="Your response"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim() || loading}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 self-end h-[46px] flex items-center justify-center min-w-[80px]"
                                aria-label="Next question"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Next →'
                                )}
                            </button>
                        </div>

                        {/* Skip option */}
                        <button
                            onClick={() => { setInput('(skipped)'); setTimeout(handleSubmit, 0); }}
                            className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-end -mt-1"
                        >
                            Skip this question
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default INTERACTIVE_InteractiveExplainer;
