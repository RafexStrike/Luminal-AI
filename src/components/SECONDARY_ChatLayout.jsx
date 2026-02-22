// FILE: src/components/SECONDARY_ChatLayout.jsx
// DESCRIPTION: Main layout container; renders sidebar, top hero, tabs (Chat/Flashcards/Quizzes/Notes), and content area

'use client';

import { useState, useCallback } from 'react';
import SECONDARY_ChatSidebar from './SECONDARY_ChatSidebar';
import SECONDARY_ChatWindow from './SECONDARY_ChatWindow';
import SECONDARY_FlashcardsPanel from './SECONDARY_FlashcardsPanel';
import SECONDARY_QuizzesPanel from './SECONDARY_QuizzesPanel';
import SECONDARY_SummaryPanel from './SECONDARY_SummaryPanel';
import SECONDARY_NotesPanel from './SECONDARY_NotesPanel';
import SECONDARY_RevisePanel from './SECONDARY_RevisePanel';
// import SECONDARY_TopHero from './SECONDARY_TopHero';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'summary', label: 'Summary' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'notes', label: 'Notes' },
  { id: 'revise', label: 'Revise' },
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

import { useRouter, useParams } from 'next/navigation';

export default function SECONDARY_ChatLayout() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId || null;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
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
    router.push(`/secondStage/${spaceId}`);
    setActiveTab('chat');
  }, [router]);

  // Handle when a chat is deleted
  const handleChatDeleted = useCallback((deletedChatId) => {
    if (chatId === deletedChatId) {
      router.push('/secondStage');
      setActiveTab('chat');
    }
  }, [chatId, router]);

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
            chatId={chatId}
            onDataSaved={handleDataSaved}
            onTabChange={setActiveTab}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'summary':
        return (
          <SECONDARY_SummaryPanel
            chatId={chatId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'flashcards':
        return (
          <SECONDARY_FlashcardsPanel
            chatId={chatId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'quizzes':
        return (
          <SECONDARY_QuizzesPanel
            chatId={chatId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'notes':
        return (
          <SECONDARY_NotesPanel
            chatId={chatId}
            onDataSaved={handleDataSaved}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'revise':
        return (
          <SECONDARY_RevisePanel
            userId={null}
            initialCategoryId=""
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-gray-950 text-white">
      {/* Sidebar */}
      <SECONDARY_ChatSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onSelectSpace={handleSelectSpace}
        currentChatId={chatId}
        onChatDeleted={handleChatDeleted}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Hero Section */}
        {/* <SECONDARY_TopHero onChatCreated={setCurrentChatId} /> */}

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-950 backdrop-blur-sm">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${active
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                aria-pressed={active}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-950">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
