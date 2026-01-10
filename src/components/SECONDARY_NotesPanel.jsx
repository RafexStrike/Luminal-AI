// FILE: src/components/SECONDARY_NotesPanel.jsx
// DESCRIPTION: Notion-like notes editor with Tiptap, slash commands, and server sync

'use client';

import { useState, useEffect } from 'react';
import SECONDARY_TiptapEditor from './SECONDARY_TiptapEditor';

/**
 * SECONDARY_NotesPanel
 * 
 * Features:
 *   - Notion-like rich text editor with Tiptap
 *   - Slash commands (/) for inserting blocks (headings, lists, quotes, code, etc.)
 *   - Formatting toolbar (bold, italic, headings, etc.)
 *   - Local storage sync (auto-save)
 *   - "Save to Server" button for persistent storage
 *   - Load notes from server when component mounts
 *   - Support for HTML-formatted content
 * 
 * Data flow:
 *   - Component loads, fetches notes from /api/secondStage/notes
 *   - User edits in Tiptap editor -> updates local state with HTML
 *   - Auto-save to localStorage every 2 seconds
 *   - User clicks "Save to Server" -> POST to /api/secondStage/notes
 *   - Server saves HTML content to MongoDB (requires auth)
 * 
 * UI Structure:
 *   - Header: Last saved time, Export, Save button
 *   - Toolbar: Formatting buttons (bold, italic, headings, lists, etc.)
 *   - Editor: Tiptap editor with placeholder and slash commands
 *   - Footer: Character count and auto-save indicator
 */
export default function SECONDARY_NotesPanel({
  chatId = null,
  onDataSaved = () => {},
  refreshTrigger = 0,
}) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Load notes from server on mount and when chat changes
  useEffect(() => {
    const loadNotes = async () => {
      console.log('NotesPanel loadNotes triggered, chatId:', chatId);
      try {
        // Fetch notes for current chat from server
        const url = chatId 
          ? `/api/secondStage/notes?chatId=${chatId}`
          : '/api/secondStage/notes';
        console.log('Fetching from:', url);
        const response = await fetch(url);
        console.log('Fetch response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data:', data);
          // Set content from server, which will be synced to editor via Tiptap's useEffect
          setContent(data.content || '');
          console.log('Content set to state:', data.content);
        } else {
          console.log('Response not ok, trying localStorage fallback');
          // If fetch fails, try localStorage fallback
          try {
            const savedNotes = localStorage.getItem('youlearn_stage2_notes');
            if (savedNotes) {
              const parsed = JSON.parse(savedNotes);
              // Support both old format (plain text) and new format (JSON with content)
              setContent(parsed.content || savedNotes);
              console.log('Loaded from localStorage');
            }
          } catch (e) {
            console.warn('Could not parse localStorage notes:', e);
          }
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        // Try localStorage fallback
        try {
          const savedNotes = localStorage.getItem('youlearn_stage2_notes');
          if (savedNotes) {
            const parsed = JSON.parse(savedNotes);
            setContent(parsed.content || savedNotes);
          }
        } catch (e) {
          console.warn('Could not parse localStorage notes:', e);
        }
      }
    };
    
    // Only load if we have a chatId (don't load for anonymous users)
    if (chatId) {
      loadNotes();
    }
  }, [chatId, refreshTrigger]);

  // Auto-save to localStorage every 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('youlearn_stage2_notes', JSON.stringify({ content, updatedAt: new Date().toISOString() }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleSaveToServer = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/secondStage/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setLastSaved(new Date());
      setSaveStatus('✓ Saved to server');
      onDataSaved();

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('✗ Error saving (check browser console)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportNotes = () => {
    const text = content;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Notes</h3>
            {lastSaved && (
              <div className="text-xs text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {saveStatus && (
              <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                {saveStatus}
              </div>
            )}
            <button
              onClick={handleExportNotes}
              className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              title="Download notes as text file"
            >
              📥 Export
            </button>
            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? '💾 Saving...' : '💾 Save to Server'}
            </button>
          </div>
        </div>
      </div>

      {/* Notes Editor with Tiptap */}
      <div className="flex-1 overflow-auto bg-white">
        <SECONDARY_TiptapEditor
          key={`editor-${chatId || 'default'}`}
          value={content}
          onChange={(html) => {
            console.log('Editor onChange called with:', html.substring(0, 50));
            setContent(html);
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <div>Press "/" for slash commands</div>
        <div>Auto-saved to browser</div>
      </div>
    </div>
  );
}
