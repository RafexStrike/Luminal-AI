// FILE: src/components/interactive/INTERACTIVE_AnimatedViz.jsx
// DESCRIPTION: Dispatches to the correct animated visualization based on viz_type
// Six self-contained animated SVG/Canvas visualizations — zero external deps.

'use client';

import React, { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. NODES_FORMING — neurons appearing and connecting
// ─────────────────────────────────────────────────────────────────────────────
function NodesForming({ config = {} }) {
    const { nodeCount = 5, labels = [] } = config;
    const [visible, setVisible] = useState(0);
    const count = Math.min(nodeCount, 8);

    useEffect(() => {
        setVisible(0);
        let i = 0;
        const id = setInterval(() => {
            i++;
            setVisible(i);
            if (i >= count) clearInterval(id);
        }, 400);
        return () => clearInterval(id);
    }, [count]);

    // Arrange nodes in a circle
    const cx = 150, cy = 110, r = 75;
    const nodes = Array.from({ length: count }, (_, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: labels[i] || `N${i + 1}` };
    });

    return (
        <svg viewBox="0 0 300 220" className="w-full h-full" aria-label="Nodes forming visualization">
            <defs>
                <radialGradient id="ng" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Edges — only between visible nodes */}
            {nodes.slice(0, visible).map((a, i) =>
                nodes.slice(0, visible).map((b, j) =>
                    i < j ? (
                        <line key={`e${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                            stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.35"
                            style={{ animation: `fadeIn 0.4s ease forwards` }} />
                    ) : null
                )
            )}

            {/* Nodes */}
            {nodes.map((n, i) => i < visible && (
                <g key={i} style={{ animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                    <circle cx={n.x} cy={n.y} r={18} fill="url(#ng)" filter="url(#glow)" />
                    <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize="9" fontWeight="600">{n.label}</text>
                </g>
            ))}

            <style>{`
        @keyframes popIn { from { transform-origin: center; transform: scale(0); opacity:0 } to { transform: scale(1); opacity:1 } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DATA_FLOWING — particles moving along a pipeline
// ─────────────────────────────────────────────────────────────────────────────
function DataFlowing({ config = {} }) {
    const { stages = ['Input', 'Process', 'Output'] } = config;
    const s = stages.slice(0, 5);
    const W = 300, H = 120;
    const stepW = W / s.length;
    const particleCount = 4;

    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 80);
        return () => clearInterval(id);
    }, []);

    const particles = Array.from({ length: particleCount }, (_, i) => {
        const progress = ((tick * 2 + i * 60) % (W + 20)) - 10;
        return { x: progress, y: H / 2 + Math.sin((tick + i * 30) * 0.1) * 8 };
    });

    return (
        <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-full" aria-label="Data flowing visualization">
            <defs>
                <linearGradient id="pipe" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#2e1065" />
                </linearGradient>
            </defs>
            {/* Pipeline track */}
            <rect x={5} y={H / 2 - 8} width={W - 10} height={16} rx={8} fill="url(#pipe)" stroke="#7c3aed" strokeWidth="1.5" />

            {/* Stage labels */}
            {s.map((label, i) => {
                const x = stepW * i + stepW / 2;
                return (
                    <g key={i}>
                        <rect x={x - 28} y={H + 4} width={56} height={20} rx={6} fill="#1e1b4b" stroke="#6d28d9" strokeWidth="1" />
                        <text x={x} y={H + 17} textAnchor="middle" fill="#c4b5fd" fontSize="9" fontWeight="600">{label}</text>
                        {i < s.length - 1 && (
                            <path d={`M${x + 28} ${H + 14} L${x + stepW - 28} ${H + 14}`}
                                stroke="#6d28d9" strokeWidth="1" markerEnd="url(#arr)" />
                        )}
                    </g>
                );
            })}

            {/* Particles */}
            {particles.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#e879f9" opacity={0.9}
                    style={{ filter: 'drop-shadow(0 0 4px #e879f9)' }} />
            ))}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LAYERS_STACKING — horizontal layers building up
// ─────────────────────────────────────────────────────────────────────────────
function LayersStacking({ config = {} }) {
    const { layers = ['Input', 'Hidden 1', 'Hidden 2', 'Output'] } = config;
    const ls = layers.slice(0, 6);
    const [revealed, setRevealed] = useState(0);

    useEffect(() => {
        setRevealed(0);
        let i = 0;
        const id = setInterval(() => { i++; setRevealed(i); if (i >= ls.length) clearInterval(id); }, 500);
        return () => clearInterval(id);
    }, [layers.join(',')]);

    const colors = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b0764', '#2e1065'];
    const lh = 30, gap = 8, W = 280;

    return (
        <svg viewBox="0 0 300 220" className="w-full h-full" aria-label="Layers stacking visualization">
            {ls.map((label, i) => {
                const y = 10 + i * (lh + gap);
                const isRevealed = i < revealed;
                return (
                    <g key={i} style={{ opacity: isRevealed ? 1 : 0, transition: 'opacity 0.4s ease', transform: `translateY(${isRevealed ? 0 : 20}px)` }}>
                        <rect x={10} y={y} width={W} height={lh} rx={8}
                            fill={colors[i] + '66'} stroke={colors[i]} strokeWidth="1.5" />
                        {/* Node dots */}
                        {Array.from({ length: 5 }, (_, j) => (
                            <circle key={j} cx={30 + j * 52} cy={y + lh / 2} r={6}
                                fill={colors[i]} opacity={0.85} />
                        ))}
                        <text x={W / 2 + 10} y={y + lh / 2 + 1} textAnchor="middle"
                            dominantBaseline="middle" fill="white" fontSize="10" fontWeight="700">{label}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONCEPT_BRANCHING — mind-map branches expanding
// ─────────────────────────────────────────────────────────────────────────────
function ConceptBranching({ config = {} }) {
    const { root = 'Concept', branches = ['Idea A', 'Idea B', 'Idea C', 'Idea D'] } = config;
    const bs = branches.slice(0, 6);
    const [revealed, setRevealed] = useState(0);

    useEffect(() => {
        setRevealed(0);
        let i = 0;
        const id = setInterval(() => { i++; setRevealed(i); if (i >= bs.length) clearInterval(id); }, 450);
        return () => clearInterval(id);
    }, [branches.join(',')]);

    const cx = 150, cy = 110;
    const positions = bs.map((_, i) => {
        const angle = (2 * Math.PI * i) / bs.length - Math.PI / 2;
        return { x: cx + 95 * Math.cos(angle), y: cy + 80 * Math.sin(angle) };
    });

    return (
        <svg viewBox="0 0 300 220" className="w-full h-full" aria-label="Concept branching visualization">
            {/* Branches */}
            {positions.map((p, i) => i < revealed && (
                <line key={`l${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y}
                    stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.6"
                    style={{ animation: 'drawLine 0.4s ease forwards' }} />
            ))}
            {/* Root node */}
            <circle cx={cx} cy={cy} r={28} fill="#4c1d95" stroke="#a855f7" strokeWidth="2" />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="9" fontWeight="700">{root}</text>

            {/* Leaf nodes */}
            {positions.map((p, i) => i < revealed && (
                <g key={`b${i}`} style={{ animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <ellipse cx={p.x} cy={p.y} rx={30} ry={16} fill="#2e1065" stroke="#7c3aed" strokeWidth="1.5" />
                    <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fill="#ddd6fe" fontSize="8" fontWeight="600">{bs[i]}</text>
                </g>
            ))}

            <style>{`
        @keyframes popIn { from { opacity:0; transform: scale(0.4) } to { opacity:1; transform: scale(1) } }
        @keyframes drawLine { from { stroke-dashoffset: 200; stroke-dasharray: 200 } to { stroke-dashoffset: 0 } }
      `}</style>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMPARISON — two columns building side-by-side
// ─────────────────────────────────────────────────────────────────────────────
function Comparison({ config = {} }) {
    const { leftLabel = 'A', rightLabel = 'B', leftItems = [], rightItems = [] } = config;
    const maxRows = Math.max(leftItems.length, rightItems.length, 3);
    const li = leftItems.slice(0, maxRows);
    const ri = rightItems.slice(0, maxRows);
    const [revealed, setRevealed] = useState(0);

    useEffect(() => {
        setRevealed(0);
        let i = 0;
        const id = setInterval(() => { i++; setRevealed(i); if (i >= maxRows) clearInterval(id); }, 400);
        return () => clearInterval(id);
    }, [maxRows]);

    return (
        <div className="w-full h-full flex gap-3 p-2">
            {[{ label: leftLabel, items: li, color: 'border-purple-500 bg-purple-900/20' },
            { label: rightLabel, items: ri, color: 'border-violet-400 bg-violet-900/20' }].map((col, ci) => (
                <div key={ci} className="flex-1 flex flex-col gap-1">
                    <div className={`text-center text-xs font-bold py-1 rounded border ${col.color} text-white`}>{col.label}</div>
                    {Array.from({ length: maxRows }, (_, i) => (
                        <div key={i}
                            className={`text-xs p-1.5 rounded border transition-all duration-300 ${col.color} text-gray-200 ${i < revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                            style={{ transitionDelay: `${i * 50}ms` }}>
                            {col.items[i] || '—'}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PROCESS_STEPS — sequential steps with animated arrows
// ─────────────────────────────────────────────────────────────────────────────
function ProcessSteps({ config = {} }) {
    const { steps = ['Start', 'Process', 'Decide', 'End'] } = config;
    const ps = steps.slice(0, 6);
    const [active, setActive] = useState(-1);

    useEffect(() => {
        setActive(-1);
        let i = -1;
        const id = setInterval(() => {
            i++;
            setActive(i);
            if (i >= ps.length - 1) clearInterval(id);
        }, 550);
        return () => clearInterval(id);
    }, [steps.join(',')]);

    const W = 280, bw = 52, bh = 28;
    const isHorizontal = ps.length <= 4;

    if (isHorizontal) {
        const spacing = W / ps.length;
        return (
            <svg viewBox="0 0 300 100" className="w-full h-full" aria-label="Process steps visualization">
                {ps.map((step, i) => {
                    const x = 10 + spacing * i;
                    const isActive = i <= active;
                    return (
                        <g key={i}>
                            <rect x={x} y={36} width={bw} height={bh} rx={6}
                                fill={isActive ? '#7c3aed' : '#1e1b4b'} stroke={isActive ? '#a855f7' : '#4c1d95'}
                                strokeWidth="1.5" style={{ transition: 'fill 0.3s ease' }} />
                            <text x={x + bw / 2} y={50 + 1} textAnchor="middle" dominantBaseline="middle"
                                fill={isActive ? 'white' : '#6d28d9'} fontSize="8" fontWeight="600"
                                style={{ transition: 'fill 0.3s ease' }}>{step}</text>
                            {i < ps.length - 1 && isActive && (
                                <path d={`M${x + bw + 2} 50 L${x + spacing - 2} 50`}
                                    stroke="#a855f7" strokeWidth="2" markerEnd="url(#arr)"
                                    style={{ animation: 'drawLine 0.3s ease' }} />
                            )}
                        </g>
                    );
                })}
                <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
                    </marker>
                </defs>
                <style>{`@keyframes drawLine { from { opacity:0 } to { opacity:1 } }`}</style>
            </svg>
        );
    }

    // Vertical layout for 5+ steps
    const spacing = 200 / ps.length;
    return (
        <svg viewBox="0 0 200 220" className="w-full h-full" aria-label="Process steps visualization">
            <defs>
                <marker id="arrv" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
                </marker>
            </defs>
            {ps.map((step, i) => {
                const y = 10 + spacing * i;
                const isActive = i <= active;
                return (
                    <g key={i}>
                        <rect x={74} y={y} width={80} height={bh} rx={6}
                            fill={isActive ? '#7c3aed' : '#1e1b4b'} stroke={isActive ? '#a855f7' : '#4c1d95'}
                            strokeWidth="1.5" style={{ transition: 'fill 0.3s ease' }} />
                        <text x={114} y={y + bh / 2 + 1} textAnchor="middle" dominantBaseline="middle"
                            fill={isActive ? 'white' : '#6d28d9'} fontSize="8" fontWeight="600">{step}</text>
                        {i < ps.length - 1 && isActive && (
                            <line x1={114} y1={y + bh + 1} x2={114} y2={y + spacing - 1}
                                stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrv)" />
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────────
const VIZ_MAP = {
    nodes_forming: NodesForming,
    data_flowing: DataFlowing,
    layers_stacking: LayersStacking,
    concept_branching: ConceptBranching,
    comparison: Comparison,
    process_steps: ProcessSteps,
};

/**
 * @param {Object} props
 * @param {string} props.vizType   — One of the INTERACTIVE_VIZ_TYPES values
 * @param {Object} props.vizConfig — Arbitrary config object passed to the component
 * @param {string} [props.className]
 */
export function INTERACTIVE_AnimatedViz({ vizType, vizConfig = {}, className = '' }) {
    const Component = VIZ_MAP[vizType];

    if (!Component) {
        return (
            <div className={`flex items-center justify-center text-gray-600 text-xs italic ${className}`}>
                Unknown viz type: {vizType}
            </div>
        );
    }

    return (
        <div className={`w-full h-full ${className}`} aria-label={`Animated visualization: ${vizType}`}>
            <Component config={vizConfig} />
        </div>
    );
}

export default INTERACTIVE_AnimatedViz;
