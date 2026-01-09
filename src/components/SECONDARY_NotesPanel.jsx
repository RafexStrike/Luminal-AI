// FILE: src/components/SECONDARY_NotesPanel.jsx
// DESCRIPTION: Simple floating notes editor with local storage and server sync

'use client';

import { useState, useEffect } from 'react';

/**
 * SECONDARY_NotesPanel
 * 
 * Features:
 *   - Simple text area for note-taking
 *   - Local storage sync (auto-save)
 *   - "Save to Server" button for persistent storage
 *   - Load notes from server when component mounts
 * 
 * Data flow:
 *   - Component loads, fetches notes from /api/secondStage/notes
 *   - User types in textarea -> updates local state
 *   - Auto-save to localStorage every 1 second
 *   - User clicks "Save to Server" -> POST to /api/secondStage/notes
 *   - Server saves to MongoDB (requires auth)
 */
export default function SECONDARY_NotesPanel({
  onDataSaved = () => {},
  refreshTrigger = 0,
}) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Load notes from server on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/secondStage/notes');
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || '');
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        // Try to load from localStorage fallback
        const savedNotes = localStorage.getItem('youlearn_stage2_notes');
        if (savedNotes) {
          setContent(savedNotes);
        }
      }
    };
    loadNotes();
  }, [refreshTrigger]);

  // Auto-save to localStorage every 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('youlearn_stage2_notes', content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleSaveToServer = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/secondStage/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
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

      {/* Notes Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start taking notes here... (auto-saved to browser)"
        className="flex-1 p-4 outline-none resize-none text-gray-900 placeholder-gray-400"
      />

      {/* Footer Info */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <div>{content.length} characters</div>
        <div>Auto-saved to browser locally</div>
      </div>
    </div>
  );
}
