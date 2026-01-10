// FILE: src/components/SECONDARY_ChatLayout.jsx
// DESCRIPTION: Main layout container; renders sidebar, top hero, tabs (Chat/Flashcards/Quizzes/Notes), and content area

'use client';

import { useState, useCallback } from 'react';
import SECONDARY_ChatSidebar from './SECONDARY_ChatSidebar';
import SECONDARY_ChatWindow from './SECONDARY_ChatWindow';
import SECONDARY_FlashcardsPanel from './SECONDARY_FlashcardsPanel';
import SECONDARY_QuizzesPanel from './SECONDARY_QuizzesPanel';
import SECONDARY_NotesPanel from './SECONDARY_NotesPanel';
import SECONDARY_TopHero from './SECONDARY_TopHero';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'notes', label: 'Notes' },
];

/**
 * SECONDARY_ChatLayout
 * 
 * Layout structure:
 *   - Sidebar (left, collapsible): space management
 *   - Main area (center):
 *     - Top hero: Upload/Link/Paste/Record cards + search
 *     - Tab navigation
 *     - Tab content area
 * 
 * State:
 *   - sidebarCollapsed: boolean (persisted to localStorage)
 *   - activeTab: current tab (chat/flashcards/quizzes/notes)
 *   - currentChatId: ID of active chat session
 * 
 * Data flow:
 *   - User interacts with top hero or chat window
 *   - Messages posted to /api/secondStage/chat
 *   - User selects messages and generates summaries/flashcards/quizzes
 *   - Results displayed in respective tabs
 */
import theme from '../design/theme.config';

export default function SECONDARY_ChatLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentChatId, setCurrentChatId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load sidebar state from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem('youlearn_stage2_sidebar_collapsed');
    if (saved) setSidebarCollapsed(JSON.parse(saved));
  }, []);

  const handleToggleSidebar = useCallback(() => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('youlearn_stage2_sidebar_collapsed', JSON.stringify(newState));
  }, [sidebarCollapsed]);

  const handleSelectSpace = useCallback((spaceId) => {
    setCurrentChatId(spaceId);
    setActiveTab('chat');
  }, []);

  // Trigger refresh of content when data is saved
  const handleDataSaved = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <SECONDARY_ChatWindow
            chatId={currentChatId}
            onDataSaved={handleDataSaved}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'flashcards':
        return (
          <SECONDARY_FlashcardsPanel
            chatId={currentChatId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'quizzes':
        return (
          <SECONDARY_QuizzesPanel
            chatId={currentChatId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'notes':
        return (
          <SECONDARY_NotesPanel
            onDataSaved={handleDataSaved}
            refreshTrigger={refreshTrigger}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-full ${theme.colors.background}`}>
      {/* Sidebar */}
      <SECONDARY_ChatSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onSelectSpace={handleSelectSpace}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Hero Section */}
        <SECONDARY_TopHero onChatCreated={setCurrentChatId} />

        {/* Tab Navigation */}
        <div className={`border-b ${theme.colors.border} ${theme.colors.panel} px-6 py-3 flex gap-4`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === tab.id ? ` ${theme.colors.accentBg} ${theme.colors.accent}` : `text-gray-700 hover:bg-gray-100`}`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
