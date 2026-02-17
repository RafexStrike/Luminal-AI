// FILE: src/components/SECONDARY_RevisePanel.jsx
// DESCRIPTION: Simplified category-scoped revision chat panel
// PURPOSE: Ask questions about your study materials in a specific category

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCollectionNames } from '../lib/collection-utils';

/**
 * SECONDARY_RevisePanel
 *
 * Simple revision chat: pick a category → ask questions → get answers from your study materials.
 */
export default function SECONDARY_RevisePanel() {
    // ── State ──
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [composerText, setComposerText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCats, setIsLoadingCats] = useState(false);

    const messagesEndRef = useRef(null);
    const composerRef = useRef(null);

    // ── Auto-scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Initial load: Fetch categories from chats ──
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCats(true);
            try {
                const res = await fetch('/api/secondStage/chats');
                if (res.ok) {
                    const data = await res.json();
                    const names = getCollectionNames(data.chats || []);
                    setCategories(names);
                    if (names.length > 0 && !categoryId) {
                        setCategoryId(names[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
            } finally {
                setIsLoadingCats(false);
            }
        };
        fetchCategories();
    }, []);

    // ── Load sessions when category changes ──
    useEffect(() => {
        if (!categoryId) {
            setSessions([]);
            setSessionId(null);
            return;
        }
        loadSessions();
    }, [categoryId]);

    // ── Load history when session changes ──
    useEffect(() => {
        if (!sessionId) {
            setMessages([]);
            return;
        }
        loadHistory();
    }, [sessionId]);

    // ── API calls ──
    const loadSessions = async () => {
        try {
            const res = await fetch(
                `/api/secondStage/reviseFromContext/sessions?categoryId=${encodeURIComponent(categoryId)}`
            );
            if (res.ok) {
                const data = await res.json();
                const loadedSessions = data.sessions || [];
                setSessions(loadedSessions);
                if (loadedSessions.length > 0) {
                    setSessionId(loadedSessions[0].sessionId);
                } else {
                    setSessionId(null);
                }
            }
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    };

    const loadHistory = async () => {
        try {
            const res = await fetch(
                `/api/secondStage/reviseFromContext/sessions/${sessionId}/history`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(
                    (data.messages || []).map((m, i) => ({
                        id: `msg_${i}_${m.timestamp}`,
                        sender: m.sender,
                        text: m.text,
                        timestamp: m.timestamp,
                    }))
                );
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const handleCreateSession = async () => {
        if (!categoryId) return;
        try {
            const res = await fetch('/api/secondStage/reviseFromContext/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId,
                    name: `Revise — ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSessions((prev) => [data.session, ...prev]);
                setSessionId(data.session.sessionId);
            }
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const handleSendMessage = useCallback(async () => {
        if (!composerText.trim() || !sessionId || !categoryId || isLoading) return;

        const userMsg = {
            id: `msg_user_${Date.now()}`,
            sender: 'user',
            text: composerText,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const queryToSend = composerText;
        setComposerText('');
        setIsLoading(true);

        try {
            const res = await fetch(
                `/api/secondStage/reviseFromContext/sessions/${sessionId}/message`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        categoryId,
                        query: queryToSend,
                    }),
                }
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `API error: ${res.status}`);
            }

            const data = await res.json();

            const agentMsg = {
                id: `msg_agent_${Date.now()}`,
                sender: 'agent',
                text: data.answer || 'No response',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, agentMsg]);
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg_err_${Date.now()}`,
                    sender: 'agent',
                    text: `❌ Error: ${err.message}`,
                    timestamp: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [composerText, sessionId, categoryId, isLoading]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ── Render ──
    return (
        <div className="flex h-full bg-gray-950 text-white">
            {/* ── Session Sidebar ── */}
            <div className="w-64 flex-shrink-0 border-r border-gray-800/50 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col">
                {/* Category selector */}
                <div className="p-4 border-b border-gray-800/50">
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Category</label>
                    <div className="relative">
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={isLoadingCats}
                            className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
                        >
                            {isLoadingCats ? (
                                <option>Loading...</option>
                            ) : categories.length === 0 ? (
                                <option value="">No categories</option>
                            ) : (
                                categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))
                            )}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* New session button */}
                <div className="p-3">
                    <button
                        onClick={handleCreateSession}
                        disabled={!categoryId}
                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                        + New Session
                    </button>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-auto px-2 pb-4 space-y-1">
                    {sessions.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-6">
                            No sessions yet
                        </p>
                    )}
                    {sessions.map((s) => (
                        <button
                            key={s.sessionId}
                            onClick={() => setSessionId(s.sessionId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${sessionId === s.sessionId
                                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                                : 'text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent'
                                }`}
                        >
                            {s.name || 'Unnamed'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main Area ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-950 backdrop-blur-sm">
                    <span className="text-sm font-medium text-gray-300">📚 Revise From Context</span>
                    {categoryId && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300">
                            {categoryId}
                        </span>
                    )}
                </div>

                {/* Chat messages area */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {!sessionId && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📚</div>
                                <p className="text-gray-400 text-sm">
                                    Select a category and create a session to start revising
                                </p>
                            </div>
                        </div>
                    )}

                    {sessionId && messages.length === 0 && !isLoading && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-4">✨</div>
                                <p className="text-gray-400 text-sm">
                                    Ask a question about your study materials
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                        >
                            <div
                                className={`max-w-[75%] p-4 rounded-lg transition-all ${msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 border border-gray-700/50'
                                    }`}
                            >
                                <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-start gap-3">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 rounded-lg p-4 max-w-md border border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Searching your study materials...</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                {sessionId && (
                    <div className="border-t border-gray-800/50 bg-gradient-to-br from-gray-900 to-gray-800 p-4 backdrop-blur-sm flex-shrink-0">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50 focus-within:border-purple-500/50 transition-colors">
                                    <textarea
                                        ref={composerRef}
                                        value={composerText}
                                        onChange={(e) => setComposerText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a question about your study materials..."
                                        className="flex-1 outline-none bg-transparent text-white placeholder:text-gray-500 focus-visible:outline-none resize-none min-h-[40px] max-h-[120px] text-sm"
                                        rows="1"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!composerText.trim() || isLoading}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
