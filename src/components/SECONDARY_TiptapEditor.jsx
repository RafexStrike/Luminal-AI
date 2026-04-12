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

  const containerRef = useRef(null);

  // Create refs to access state inside handleKeyDown without stale closures
  const showSlashMenuRef = useRef(showSlashMenu);
  const slashItemsRef = useRef(slashItems);
  const selectedIndexRef = useRef(selectedIndex);

  useEffect(() => { showSlashMenuRef.current = showSlashMenu; }, [showSlashMenu]);
  useEffect(() => { slashItemsRef.current = slashItems; }, [slashItems]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

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
        placeholder: "Type '/' for commands...",
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
        const editorRect = containerRef.current.getBoundingClientRect();

        setSlashMenuPosition({
          top: coords.bottom - editorRect.top + containerRef.current.scrollTop + 10,
          left: coords.left - editorRect.left,
        });

        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap outline-none focus:outline-none px-8 py-10 text-gray-100 min-h-[calc(100vh-200px)] font-sans max-w-4xl mx-auto selection:bg-purple-500/30',
      },
      handleKeyDown: (view, event) => {
        if (!showSlashMenuRef.current) return false;

        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i > 0 ? i - 1 : slashItemsRef.current.length - 1));
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i < slashItemsRef.current.length - 1 ? i + 1 : 0));
          return true;
        }
        if (event.key === 'Enter') {
          if (slashItemsRef.current.length > 0) {
            selectCommand(slashItemsRef.current[selectedIndexRef.current]);
            return true;
          }
        }
        if (event.key === 'Escape') {
          setShowSlashMenu(false);
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  const selectCommand = useCallback((item) => {
    if (!editor) return;

    const { $from } = editor.state.selection;
    // Calculate the range of the slash command text
    // We need to find the "/" before the current position
    const text = $from.parent.textBetween(Math.max(0, $from.parentOffset - 20), $from.parentOffset, null, '\ufffc');
    const match = text.match(/\/([\w]*)$/);

    if (match) {
      const deletePos = $from.pos - match[0].length;
      const range = { from: deletePos, to: $from.pos };
      item.command({ editor, range, actions });
    }

    setShowSlashMenu(false);
  }, [editor, actions]);

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

  // Update editor content when value prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (currentContent !== value && !editor.isFocused) {
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  // Handle AI Submission
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const currentChatId = aiChatId || `editor-${Date.now()}`;
      setAiChatId(currentChatId);

      const editorContext = editor?.getText() || '';
      const contextAwarePrompt = `Context from current document:\n${editorContext.slice(0, 5000)}\n\nUser Request: ${aiPrompt}`;

      const response = await fetch('/api/secondStage/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: currentChatId,
          prompt: contextAwarePrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiResponse(data.content);

    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsAiLoading(false);
      setAiPrompt('');
    }
  };

  const insertAiResponse = (mode = 'append') => {
    if (!editor || !aiResponse) return;

    const htmlContent = aiResponse.split('\n\n').map(p => `<p>${p}</p>`).join('');

    if (mode === 'replace') {
      editor.chain().focus().setContent(htmlContent).run();
    } else {
      editor.chain().focus().insertContent(htmlContent).run();
    }

    setAiModalOpen(false);
    setAiResponse('');
  };

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-[#0a0a0f]">
      {/* Minimal Toolbar */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md px-6 py-2 flex items-center gap-1 overflow-x-auto whitespace-nowrap sticky top-0 z-40 transition-all duration-300 scrollbar-hide">
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
        <div className="w-px h-4 bg-white/10 mx-2" />
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
        <div className="w-px h-4 bg-white/10 mx-2" />
        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold transition-all shadow-lg shadow-purple-600/20 group active:scale-95"
        >
          <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
          Ask AI
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-[#0a0a0f] relative cursor-text scroll-smooth" onClick={() => editor.chain().focus().run()}>
        <div className="py-10 max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Custom Slash Command Menu */}
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
            className="p-1 w-[260px] max-h-[320px] overflow-y-auto bg-gray-900 border-white/10 shadow-3xl rounded-xl border animate-in fade-in zoom-in-95 duration-200"
            align="start"
            side="bottom"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-0.5">
              <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-gray-500">Commands</div>
              {slashItems.length > 0 ? (
                slashItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === selectedIndex;
                  return (
                    <button
                      key={index}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectCommand(item)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-left transition-all duration-200 group ${isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'hover:bg-white/5 text-gray-300'
                        }`}
                    >
                      <div className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 group-hover:bg-white/10'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold leading-tight truncate">{item.title}</span>
                        <span className={`text-[10px] truncate ${isActive ? 'text-purple-100' : 'text-gray-500'}`}>{item.description}</span>
                      </div>
                      {isActive && (
                        <div className="text-[10px] font-mono text-purple-200 bg-white/10 px-1 rounded border border-white/20 animate-pulse">
                          ↵
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-sm text-gray-500 text-center italic">No matching results</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Floating AI Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gray-950 border-gray-800 text-white shadow-2xl rounded-2xl">
          <div className="p-6 space-y-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-purple-400">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Sparkles size={20} className="text-purple-500" />
              </div>
              AI Writing Assistant
            </DialogTitle>

            {aiResponse && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 max-h-[350px] overflow-y-auto text-sm text-gray-200 prose prose-invert prose-sm scrollbar-thin scrollbar-thumb-white/10">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            )}

            <div className="relative group">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Write an outline, rewrite this section, or expand on..."
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none min-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={handleAiSubmit}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {isAiLoading ? 'Thinking...' : 'Generate'}
                  {!isAiLoading && <CornerDownLeft size={14} />}
                </button>
              </div>
            </div>

            {aiResponse && (
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => insertAiResponse('replace')}
                  className="text-sm px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={() => insertAiResponse('append')}
                  className="text-sm px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors font-semibold"
                >
                  Insert below
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="border-t border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md px-6 py-2 text-[10px] font-medium text-gray-500 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Type size={10} /> Type "/" for commands</span>
          <span className="w-px h-2 bg-white/10" />
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
        </div>
        <div className="flex items-center gap-1 text-purple-500/40 lowercase tracking-tighter">
          Luminal AI Editor
        </div>
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
      className={`p-2 rounded-lg transition-all duration-200 group active:scale-90 ${active
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
        }`}
    >
      <Icon size={18} className={active ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
    </button>
  );
}
