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



  return (
    <div className={`${theme.colors.panel} border-b ${theme.colors.border} p-8`}>
      {/* Hero Text + Controls */}
      <div className="flex items-center justify-between mb-12">
        
        <div>
          <ThemeToggle />
        </div>
      </div>

     
    </div>
  );
}
