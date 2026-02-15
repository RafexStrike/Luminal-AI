// FILE: src/components/SECONDARY_TiptapEditor.jsx
// DESCRIPTION: Notion-like rich text editor with Tiptap, slash commands, and AI integration
// PURPOSE: Provide a seamless writing experience with AI assistance

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CornerDownLeft,
  Type,
  Minus,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ChatComposer from './SECONDARY_ChatComposer';
import ReactMarkdown from 'react-markdown';

// Slash command menu data
const SLASH_COMMANDS = [
  {
    title: 'Ask AI',
    description: 'Generate content with AI',
    searchTerms: ['ai', 'generate', 'ask', 'magic'],
    icon: Sparkles,
    command: ({ editor, range, actions }) => {
      editor.chain().focus().deleteRange(range).run();
      actions.openAiModal();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large heading',
    searchTerms: ['heading', 'h1', 'title', 'big'],
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    searchTerms: ['heading', 'h2', 'subtitle', 'section'],
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    searchTerms: ['heading', 'h3', 'sub'],
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    searchTerms: ['list', 'bullet', 'ul', 'points'],
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    searchTerms: ['list', 'number', 'ol', 'ordered'],
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Highlight quoted text',
    searchTerms: ['quote', 'blockquote', 'cite', 'saying'],
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Snippet of code',
    searchTerms: ['code', 'codeblock', 'pre', 'snippet'],
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    searchTerms: ['divider', 'hr', 'line', 'separator'],
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];
// Main editor component
export default function SECONDARY_TiptapEditor({ value = '', onChange = () => { } }) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  const [slashItems, setSlashItems] = useState(SLASH_COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiChatId, setAiChatId] = useState(null); // To maintain conversation context if needed

  const editorRef = useRef(null);

  // Memoized actions for commands
  const actions = {
    openAiModal: () => {
      setAiModalOpen(true);
      setShowSlashMenu(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or start typing...",
      }),
      CharacterCount.configure({
        limit: null,
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Handle slash command detection
      const { $from } = editor.state.selection;
      const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 20), $from.parentOffset, null, '\ufffc');

      const match = textBefore.match(/\/([\w]*)$/);

      if (match) {
        const query = match[1];
        setSlashQuery(query);

        // Calculate position for the menu
        const coords = editor.view.coordsAtPos($from.pos);
        // Correct for editor container position
        const editorRect = editorRef.current.getBoundingClientRect();

        setSlashMenuPosition({
          top: coords.bottom - editorRect.top + editorRef.current.scrollTop + 10,
          left: coords.left - editorRect.left,
        });

        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class:
          'tiptap outline-none focus:outline-none px-8 py-6 text-gray-900 min-h-[calc(100vh-200px)] font-sans',
      },
    },
    immediatelyRender: true,
  });

  // Update slash command suggestions
  useEffect(() => {
    if (showSlashMenu) {
      const filtered = SLASH_COMMANDS.filter((item) => {
        const query = slashQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.searchTerms.some((term) => term.toLowerCase().includes(query))
        );
      });
      setSlashItems(filtered);
      setSelectedIndex(0);
    }
  }, [slashQuery, showSlashMenu]);

  // Handle keyboard events for slash menu
  useEffect(() => {
    if (!editor || !showSlashMenu) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowSlashMenu(false);
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i > 0 ? i - 1 : slashItems.length - 1));
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i < slashItems.length - 1 ? i + 1 : 0));
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (slashItems.length > 0) {
          selectCommand(slashItems[selectedIndex]);
        }
        event.preventDefault(); // Always prevent default Enter to avoid new line
      }
    };

    // Attach to the editor's DOM element or document
    // Document is safer to catch bubble events from editor
    const view = editor.view.dom;
    view.addEventListener('keydown', handleKeyDown);
    return () => view.removeEventListener('keydown', handleKeyDown);
  }, [showSlashMenu, slashItems, selectedIndex, editor]); // selectCommand dependnecy omitted intentionally to avoid cyclic dep issues or use stable ref

  // Update editor content when value prop changes (e.g., when notes are loaded from server)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (currentContent !== value && !editor.isFocused) {
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  const selectCommand = useCallback((item) => {
    if (!editor) return;

    const { $from } = editor.state.selection;
    const deletePos = $from.pos - (slashQuery.length + 1);
    const range = { from: deletePos, to: $from.pos };

    item.command({ editor, range, actions });

    setShowSlashMenu(false);
  }, [editor, slashQuery, actions]);

  // Handle AI Submission
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiResponse(''); // Clear previous response

    try {
      // 1. Generate a temporary chat ID if not exists
      const currentChatId = aiChatId || `editor-${Date.now()}`;
      setAiChatId(currentChatId);

      // Get current editor content for context
      const editorContext = editor?.getText() || '';
      const contextAwarePrompt = `Context from current document:\n${editorContext.slice(0, 5000)}\n\nUser Request: ${aiPrompt}`;

      // 2. Call the chat API
      const response = await fetch('/api/secondStage/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: currentChatId,
          prompt: contextAwarePrompt,
          // Optional: passing context if we wanted to implement RAG here
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiResponse(data.content); // For non-streaming response

    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsAiLoading(false);
      setAiPrompt(''); // Clear prompt input
    }
  };

  const insertAiResponse = (mode = 'append') => {
    if (!editor || !aiResponse) return;

    // Convert markdown to HTML (simple conversion or use extensions)
    // Tiptap handles markdown pasting usually, but let's just insert as HTML paragraphs for now
    // Ideally we'd parse markdown here. For this demo, let's treat it as text.

    // A better approach would be to parse the markdown into HTML nodes
    // Since we don't have a markdown parser installed in this file, we'll rely on Tiptap's ability 
    // to handle pasted content or insert text.

    // Using a simple split for paragraphs to make it a bit nicer than one big block
    const htmlContent = aiResponse.split('\n\n').map(p => `<p>${p}</p>`).join('');

    if (mode === 'replace') {
      editor.chain().focus().setContent(htmlContent).run();
    } else {
      // Insert at current cursor position
      editor.chain().focus().insertContent(htmlContent).run();
    }

    setAiModalOpen(false);
    setAiResponse('');
  };

  if (!editor) return null;

  return (
    <div ref={editorRef} className="relative w-full h-full flex flex-col bg-white">
      {/* Minimal Toolbar (Floating or sticky, we'll keep it simple/sticky for now but cleaner) */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center gap-1 flex-wrap sticky top-0 z-40 transition-all duration-200">
        <ToolbarButton
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          icon={Strikethrough}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        />
        <div className="w-px h-4 bg-gray-200 mx-2" />
        <ToolbarButton
          icon={Heading1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        />
        <ToolbarButton
          icon={Heading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        />
        <ToolbarButton
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        />
        <div className="w-px h-4 bg-gray-200 mx-2" />
        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm font-medium transition-colors"
        >
          <Sparkles size={14} />
          Ask AI
        </button>
      </div>

      {/* Editor Content - Infinite Canvas Style */}
      <div className="flex-1 overflow-auto bg-white relative cursor-text" onClick={() => editor.chain().focus().run()}>
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Custom Slash Command Menu - Manual Implementation */}
        <Popover open={showSlashMenu} onOpenChange={setShowSlashMenu} modal={false}>
          <PopoverTrigger asChild>
            <div
              style={{
                position: 'absolute',
                top: slashMenuPosition.top,
                left: slashMenuPosition.left,
                width: 1,
                height: 1,
                pointerEvents: 'none',
              }}
            />
          </PopoverTrigger>
          <PopoverContent
            className="p-1 w-[240px] max-h-[300px] overflow-y-auto"
            align="start"
            side="bottom"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Suggestions</div>
              {slashItems.length > 0 ? (
                slashItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectCommand(item)}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-left transition-colors ${index === selectedIndex
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-[10px] text-gray-400">{item.description}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-sm text-gray-500 text-center">No results</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Floating AI Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gray-900 border-gray-800 text-white shadow-2xl">
          <div className="p-4 space-y-4">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-purple-400">
              <Sparkles size={18} />
              AI Assistant
            </DialogTitle>

            {/* Chat History / Response Area */}
            {aiResponse && (
              <div className="bg-gray-800/50 rounded-lg p-4 max-h-[300px] overflow-y-auto text-sm text-gray-200 prose prose-invert prose-sm">
                {/* Using a simple whitespace preserver or markdown renderer would be better */}
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            )}

            {/* Input Area - Reusing ChatComposer styles notionally */}
            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tell AI what to write..."
                className="w-full bg-gray-800 p-3 rounded-md text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit();
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={handleAiSubmit}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="p-1.5 bg-purple-600 rounded-md text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isAiLoading ? <Sparkles className="animate-pulse w-4 h-4" /> : <CornerDownLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions for Response */}
            {aiResponse && (
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-800">
                <button
                  onClick={() => insertAiResponse('replace')}
                  className="text-xs px-3 py-1.5 rounded bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors"
                >
                  Replace Selection
                </button>
                <button
                  onClick={() => insertAiResponse('append')}
                  className="text-xs px-3 py-1.5 rounded bg-green-900/30 text-green-300 hover:bg-green-900/50 transition-colors"
                >
                  Insert Below
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white px-4 py-2 text-xs text-gray-400 flex justify-between items-center">
        <span>Type "/" for commands</span>
        <span>{editor.storage.characterCount?.characters() || 0} characters</span>
      </div>
    </div>
  );
}

// Reusable toolbar button component
function ToolbarButton({ icon: Icon, onClick, active = false, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <Icon size={16} />
    </button>
  );
}

