// FILE: src/components/SECONDARY_TopHero.jsx
// DESCRIPTION: Top section with "Learn anything" heading, action cards (Upload/Link/Paste/Record), and search bar

'use client';

import { useState } from 'react';
import theme from '../design/theme.config';
import ThemeToggle from './ThemeToggle';

/**
 * SECONDARY_TopHero
 * 
 * Features:
 *   - Hero text: "Learn anything"
 *   - Four action cards: Upload, Link, Paste, Record
 *   - Search bar at bottom for filtering/querying
 * 
 * Callbacks:
 *   - onChatCreated(chatId) when user initiates learning session
 *   - Action card clicks are currently placeholders
 */
export default function SECONDARY_TopHero({ onChatCreated = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleActionClick = (action) => {
    // TODO: Implement modal/handler for each action
    console.log(`Action clicked: ${action}`);
    // Create a new chat session
    const newChatId = `chat_${Date.now()}`;
    onChatCreated(newChatId);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Implement search logic
      console.log(`Search: ${searchQuery}`);
    }
  };

  const actions = [
    { id: 'upload', label: 'Upload', svg: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11l4 4 4-4" /></svg>), desc: 'File, audio, video' },
    { id: 'link', label: 'Link', svg: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14a4 4 0 005.657 0l1.415-1.414" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10a4 4 0 00-5.657 0L7.928 11.414" /></svg>), desc: 'YouTube, Website' },
    { id: 'paste', label: 'Paste', svg: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden><rect x="9" y="2" width="6" height="4" rx="1" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7v13a2 2 0 002 2h2a2 2 0 002-2V7" /></svg>), desc: 'Copied Text' },
    { id: 'record', label: 'Record', svg: (<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden><circle cx="12" cy="10" r="3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 11-14 0v-2" /></svg>), desc: 'Record Lecture' },
  ];

  return (
    <div className={`${theme.colors.panel} border-b ${theme.colors.border} p-8`}>
      {/* Hero Text + Controls */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Time to learn</h1>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
            aria-label={`${action.label}: ${action.desc}`}
          >
            <div className="group-hover:scale-110 transition-transform" aria-hidden>
              {action.svg}
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{action.label}</div>
              <div className="text-xs text-gray-500">{action.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-300 hover:border-blue-400 transition-colors shadow-sm">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Learn anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
