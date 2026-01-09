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
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'flashcards', label: 'Flashcards', icon: '🎴' },
  { id: 'quizzes', label: 'Quizzes', icon: '📝' },
  { id: 'notes', label: 'Notes', icon: '📓' },
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
    <div className="flex h-full bg-gray-50">
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
        <div className="border-b border-gray-200 bg-white px-6 py-3 flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-pressed={activeTab === tab.id}
            >
              <span>{tab.icon}</span>
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
