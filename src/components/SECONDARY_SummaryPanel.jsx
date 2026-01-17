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

  // Load summaries from DB when chat changes
  useEffect(() => {
    if (chatId) {
      const loadSummaries = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/secondStage/summary?chatId=${chatId}`);
          if (response.ok) {
            const data = await response.json();
            setSummaries(data.summaries || []);
          }
        } catch (error) {
          console.error('Error loading summaries:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadSummaries();
    }
  }, [chatId, refreshTrigger]);

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
    if (summary.type === 'normal') return summary.content || '';

    // Incremental summaries are structured JSON - build a readable markdown representation
    if (summary.type === 'incremental') {
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
    if (summary.type === 'normal') {
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
      {summaries.map((summary, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow text-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-700 to-violet-600 text-white">
                  {summary.type === 'normal' ? 'Normal Summary' : 'Incremental Summary'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(summary.createdAt)}</span>
              </div>
              {summary.messageCount && (
                <p className="text-xs text-gray-400">{summary.messageCount} message(s)</p>
              )}
            </div>
            <button
              onClick={() => setExpandedSummaryId(expandedSummaryId === idx ? null : idx)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Expand summary"
            >
              {expandedSummaryId === idx ? '−' : '+'}
            </button>
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
