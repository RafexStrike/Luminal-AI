// FILE: src/components/SECONDARY_SummaryPanel.jsx
// DESCRIPTION: Display generated summaries (both normal and incremental); supports export and copy functionality

'use client';

import { useState, useEffect } from 'react';
import MarkdownRenderer from './ui/MarkdownRenderer';

/**
 * SECONDARY_SummaryPanel
 * 
 * Features:
 *   - Display regular summaries (markdown format)
 *   - Display incremental summaries (structured JSON with key points, examples, questions)
 *   - Export summaries as JSON or markdown
 *   - Copy summary content to clipboard
 *   - Empty state when no summaries generated
 * 
 * Data flow:
 *   - User selects messages and clicks "Generate Summary"
 *   - Selects "Regular Summary" or "Incremental Summary" from dialog
 *   - Request sent to /api/secondStage/summary { messageIds, mode }
 *   - API returns { summary: string|object, mode: string }
 *   - Summary displayed in formatted view
 *   - User can export or copy the summary
 */
export default function SECONDARY_SummaryPanel({
  chatId = null,
  refreshTrigger = 0,
}) {
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSummaryId, setExpandedSummaryId] = useState(null);

  // Auto-summary settings state
  const [autoSettings, setAutoSettings] = useState({
    enabled: false,
    messageThreshold: 10,
    mode: 'incremental',
    lastProcessedSequence: 0
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load summaries AND settings when chat changes
  useEffect(() => {
    if (chatId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Fetch summaries
          const sumResponse = await fetch(`/api/secondStage/summary?chatId=${chatId}`);
          if (sumResponse.ok) {
            const data = await sumResponse.json();
            setSummaries(data.summaries || []);
          }

          // Fetch auto-summary settings
          const setResponse = await fetch(`/api/secondStage/auto-summary?chatId=${chatId}`);
          if (setResponse.ok) {
            const settings = await setResponse.json();
            setAutoSettings(settings);
          }
        } catch (error) {
          console.error('Error loading summary panel data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [chatId, refreshTrigger]);

  const handleSaveAutoSettings = async (updates) => {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/secondStage/auto-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, ...autoSettings, ...updates })
      });
      if (response.ok) {
        const data = await response.json();
        setAutoSettings(data.settings);
      }
    } catch (error) {
      console.error('Error saving auto-summary settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportJSON = (summary) => {
    const jsonStr = JSON.stringify(
      {
        type: summary.type,
        content: summary.content,
        createdAt: summary.createdAt,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${summary.type}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = (summary) => {
    let markdownStr = '';

    if (summary.type === 'incremental') {
      // Format incremental summary as markdown
      const content = typeof summary.content === 'string'
        ? JSON.parse(summary.content)
        : summary.content;

      if (content.key_points) {
        markdownStr += '## Key Points\n\n';
        if (Array.isArray(content.key_points)) {
          markdownStr += content.key_points.map(p => `- ${p}`).join('\n');
        } else {
          markdownStr += content.key_points;
        }
        markdownStr += '\n\n';
      }

      if (content.examples) {
        markdownStr += '## Examples\n\n';
        if (Array.isArray(content.examples)) {
          markdownStr += content.examples.map(e => `- ${e}`).join('\n');
        } else {
          markdownStr += content.examples;
        }
        markdownStr += '\n\n';
      }

      if (content.questions) {
        markdownStr += '## Questions\n\n';
        if (Array.isArray(content.questions)) {
          markdownStr += content.questions.map(q => `- ${q}`).join('\n');
        } else {
          markdownStr += content.questions;
        }
        markdownStr += '\n\n';
      }
    } else {
      // Regular summary is already markdown
      markdownStr = summary.content;
    }

    const blob = new Blob([markdownStr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${summary.type}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = (summary) => {
    const text = typeof summary.content === 'string'
      ? summary.content
      : JSON.stringify(summary.content, null, 2);
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // Convert a summary object into a markdown string for consistent rendering
  const getSummaryMarkdown = (summary) => {
    if (!summary) return '';

    // Normal summaries are already markdown strings
    if (summary.type === 'normal' || summary.type === 'auto-normal') return summary.content || '';

    // Incremental summaries are structured JSON - build a readable markdown representation
    if (summary.type === 'incremental' || summary.type === 'auto-incremental') {
      try {
        const content = typeof summary.content === 'string' ? JSON.parse(summary.content) : summary.content;
        let md = '';

        if (content.key_points) {
          md += '## Key Points\n\n';
          md += Array.isArray(content.key_points) ? content.key_points.map(p => `- ${p}`).join('\n') : content.key_points;
          md += '\n\n';
        }

        if (content.examples) {
          md += '## Examples\n\n';
          md += Array.isArray(content.examples) ? content.examples.map(e => `- ${e}`).join('\n') : content.examples;
          md += '\n\n';
        }

        if (content.questions) {
          md += '## Questions\n\n';
          md += Array.isArray(content.questions) ? content.questions.map(q => `- ${q}`).join('\n') : content.questions;
          md += '\n\n';
        }

        Object.entries(content).forEach(([key, value]) => {
          if (!['key_points', 'examples', 'questions'].includes(key)) {
            md += `## ${key.replace(/_/g, ' ')}\n\n`;
            if (Array.isArray(value)) md += value.map(v => `- ${v}`).join('\n') + '\n\n';
            else md += `${value}\n\n`;
          }
        });

        return md.trim();
      } catch (err) {
        // Fallback - show raw content
        return typeof summary.content === 'string' ? summary.content : JSON.stringify(summary.content, null, 2);
      }
    }

    // Generic fallback
    return typeof summary.content === 'string' ? summary.content : JSON.stringify(summary.content, null, 2);
  };

  const renderSummaryContent = (summary) => {
    if (summary.type === 'normal' || summary.type === 'auto-normal') {
      // Regular summary is plain text/markdown
      return (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-gray-800">{summary.content}</p>
        </div>
      );
    } else {
      // Incremental summary - parse and display structured content
      try {
        const content = typeof summary.content === 'string'
          ? JSON.parse(summary.content)
          : summary.content;

        return (
          <div className="space-y-6">
            {/* Key Points */}
            {(content.key_points || content.keyPoints) && (
              <div>
                <h4 className="font-semibold text-white mb-2">Key Points</h4>
                <ul className="space-y-2">
                  {Array.isArray(content.key_points || content.keyPoints) ? (
                    (content.key_points || content.keyPoints).map((point, idx) => (
                      <li key={idx} className="flex gap-2 text-gray-200">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-700">{content.key_points || content.keyPoints}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Examples */}
            {(content.examples || content.Examples) && (
              <div>
                <h4 className="font-semibold text-white mb-2">Examples</h4>
                <ul className="space-y-2">
                  {Array.isArray(content.examples || content.Examples) ? (
                    (content.examples || content.Examples).map((example, idx) => (
                      <li key={idx} className="flex gap-2 text-gray-200">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{example}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-700">{content.examples || content.Examples}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Questions */}
            {(content.questions || content.Questions) && (
              <div>
                <h4 className="font-semibold text-white mb-2">Questions</h4>
                <ul className="space-y-2">
                  {Array.isArray(content.questions || content.Questions) ? (
                    (content.questions || content.Questions).map((question, idx) => (
                      <li key={idx} className="flex gap-2 text-gray-200">
                        <span className="text-orange-600 font-bold">•</span>
                        <span>{question}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-700">{content.questions || content.Questions}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Other fields (fallback for different JSON structures) */}
            {Object.entries(content).map(([key, value]) => {
              if (!['key_points', 'keyPoints', 'examples', 'Examples', 'questions', 'Questions'].includes(key)) {
                return (
                  <div key={key}>
                    <h4 className="font-semibold text-white mb-2 capitalize">{key}</h4>
                    {Array.isArray(value) ? (
                      <ul className="space-y-2">
                        {value.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-200">
                            <span className="text-gray-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-200">{String(value)}</p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      } catch (error) {
        console.error('Error parsing incremental summary:', error);
        return <p className="text-gray-700">{summary.content}</p>;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Loading summaries...</p>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No summaries yet</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Select messages in the chat and click "Generate Summary" to create regular or incremental summaries
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Auto-Summary Settings Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm text-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Auto-generate summaries</h3>
          <button
            onClick={() => handleSaveAutoSettings({ enabled: !autoSettings.enabled })}
            disabled={isSavingSettings}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoSettings.enabled ? 'bg-blue-600' : 'bg-gray-700'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {autoSettings.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">After every [N] messages</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={autoSettings.messageThreshold}
                  onChange={(e) => setAutoSettings({ ...autoSettings, messageThreshold: parseInt(e.target.value) })}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-24 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => handleSaveAutoSettings({})}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Summary mode</label>
              <select
                value={autoSettings.mode}
                onChange={(e) => handleSaveAutoSettings({ mode: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="incremental">Incremental</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {autoSettings.lastProcessedSequence > 0 && (
              <div className="col-span-full pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500 italic">
                  Last summary generated after message #{autoSettings.lastProcessedSequence}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 my-4" />

      {summaries.map((summary, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow text-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${summary.type.startsWith('auto')
                    ? 'from-blue-700 to-cyan-600'
                    : 'from-purple-700 to-violet-600'
                  }`}>
                  {summary.type === 'normal' && 'Normal Summary'}
                  {summary.type === 'incremental' && 'Incremental Summary'}
                  {summary.type === 'auto-normal' && 'Auto-Normal'}
                  {summary.type === 'auto-incremental' && 'Auto-Incremental'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(summary.createdAt)}</span>
              </div>
              {summary.type.startsWith('auto') && summary.messageIds?.length > 0 && (
                <p className="text-xs text-blue-400 italic">
                  Generated automatically after message #{summary.messageIds.length}
                </p>
              )}
              {summary.messageCount && (
                <p className="text-xs text-gray-400">{summary.messageCount} message(s)</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {summary.type.startsWith('auto') && (
                <button
                  onClick={() => handleSaveAutoSettings({ enabled: false })}
                  className="text-[10px] px-2 py-1 bg-red-900/30 text-red-400 border border-red-900/50 rounded hover:bg-red-900/50 transition-colors"
                  title="Disable auto-generation"
                >
                  Disable Auto
                </button>
              )}
              <button
                onClick={() => setExpandedSummaryId(expandedSummaryId === idx ? null : idx)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Expand summary"
              >
                {expandedSummaryId === idx ? '−' : '+'}
              </button>
            </div>
          </div>

          {/* Summary content (always visible) */}
          <div className="mb-4">
            <div className="bg-gradient-to-br from-purple-900/40 to-gray-900/30 border border-gray-700 rounded-lg p-4 prose prose-sm max-w-none text-gray-100">
              <MarkdownRenderer content={getSummaryMarkdown(summary)} />
            </div>
          </div>

          {/* Content (expanded) */}
          {expandedSummaryId === idx && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              {renderSummaryContent(summary)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCopySummary(summary)}
              className="px-3 py-2 text-sm bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              title="Copy to clipboard"
            >
              Copy
            </button>
            <button
              onClick={() => handleExportJSON(summary)}
              className="px-3 py-2 text-sm bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              title="Export as JSON"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExportMarkdown(summary)}
              className="px-3 py-2 text-sm bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              title="Export as Markdown"
            >
              Export MD
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
