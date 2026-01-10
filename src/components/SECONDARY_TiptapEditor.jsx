// FILE: src/components/SECONDARY_TiptapEditor.jsx
// DESCRIPTION: Notion-like rich text editor with Tiptap and slash commands

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
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Slash command menu data
const SLASH_COMMANDS = [
  {
    title: 'Heading 1',
    description: 'Large heading',
    searchTerms: ['heading', 'h1', 'title', 'big'],
    icon: Heading1,
    command: ({ editor }) => {
      editor.chain().focus().setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    searchTerms: ['heading', 'h2', 'subtitle', 'section'],
    icon: Heading2,
    command: ({ editor }) => {
      editor.chain().focus().setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    searchTerms: ['heading', 'h3', 'sub'],
    icon: Heading3,
    command: ({ editor }) => {
      editor.chain().focus().setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    searchTerms: ['list', 'bullet', 'ul', 'points'],
    icon: List,
    command: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    searchTerms: ['list', 'number', 'ol', 'ordered'],
    icon: ListOrdered,
    command: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Highlight quoted text',
    searchTerms: ['quote', 'blockquote', 'cite', 'saying'],
    icon: Quote,
    command: ({ editor }) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Snippet of code',
    searchTerms: ['code', 'codeblock', 'pre', 'snippet'],
    icon: Code,
    command: ({ editor }) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    searchTerms: ['divider', 'hr', 'line', 'separator'],
    icon: Minus,
    command: ({ editor }) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
];

// Slash command menu component
function SlashCommandMenu({ items, onSelect, selectedIndex }) {
  return (
    <div className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden max-w-sm w-72" style={{
      // Position below cursor, but this will be positioned via JS in production
      // For now, we'll use a centered approach that works
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, 0)',
    }}>
      {items.length > 0 ? (
        <div className="max-h-96 overflow-y-auto">
          {items.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors text-sm ${
                  index === selectedIndex
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <IconComponent size={18} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-500">No commands found</div>
      )}
    </div>
  );
}

// Main editor component
export default function SECONDARY_TiptapEditor({ value = '', onChange = () => {} }) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashItems, setSlashItems] = useState(SLASH_COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const editorRef = useRef(null);

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
    },
    editorProps: {
      attributes: {
        class:
          'outline-none focus:outline-none px-4 py-3 text-gray-900 min-h-96 editor-content',
      },
    },
    immediatelyRender: true,
  });

  // Update editor content when value prop changes (e.g., when notes are loaded from server)
  useEffect(() => {
    if (!editor) return;
    
    // Debug logging
    console.log('TiptapEditor useEffect triggered', { value, editorReady: !!editor });
    
    // Always update content when value changes, even if empty
    const currentContent = editor.getHTML();
    console.log('Current editor content:', currentContent);
    console.log('New value:', value);
    
    if (currentContent !== value) {
      console.log('Setting new content to editor');
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  // Handle text input for slash menu - triggered on every edit
  const handleEditorUpdate = useCallback(() => {
    if (!editor) return;

    const { $from } = editor.state.selection;
    const text = editor.state.doc.textBetween(Math.max(0, $from.pos - 50), $from.pos);
    const match = text.match(/\/([\w]*)$/);

    if (match) {
      setShowSlashMenu(true);
      setSlashQuery(match[1]);
      setSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [editor]);

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

  // Handle keyboard events
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event) => {
      if (!showSlashMenu) return;

      if (event.key === 'Escape') {
        setShowSlashMenu(false);
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i > 0 ? i - 1 : slashItems.length - 1));
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i < slashItems.length - 1 ? i + 1 : 0));
        event.preventDefault();
      } else if (event.key === 'Enter' && slashItems.length > 0) {
        selectCommand(slashItems[selectedIndex]);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSlashMenu, slashItems, selectedIndex, editor]);

  const selectCommand = (item) => {
    if (!editor) return;
    
    // Get current selection position
    const { $from } = editor.state.selection;
    
    // Calculate where the "/" started
    const deletePos = $from.pos - (slashQuery.length + 1);

    // Delete the "/" and the query text, then run the command immediately
    editor
      .chain()
      .focus()
      .deleteRange({
        from: Math.max(0, deletePos),
        to: $from.pos,
      })
      .run();

    // Execute the command in the same update cycle
    item.command({ editor });

    setShowSlashMenu(false);
  };

  // Set up editor event listeners for slash command detection
  useEffect(() => {
    if (!editor) return;

    const handleUpdateEvent = () => {
      handleEditorUpdate();
    };

    const handleSelectionEvent = () => {
      handleEditorUpdate();
    };

    editor.on('update', handleUpdateEvent);
    editor.on('selectionUpdate', handleSelectionEvent);

    return () => {
      editor.off('update', handleUpdateEvent);
      editor.off('selectionUpdate', handleSelectionEvent);
    };
  }, [editor, handleEditorUpdate]);

  if (!editor) return null;

  return (
    <div ref={editorRef} className="relative w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-1 flex-wrap sticky top-0 z-40">
        <ToolbarButton
          icon={Bold}
          onClick={() => {
            console.log('Bold clicked, editor exists:', !!editor);
            if (editor) {
              editor.chain().focus().toggleBold().run();
              console.log('Bold executed');
            }
          }}
          active={editor?.isActive('bold') || false}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => {
            console.log('Italic clicked');
            if (editor) {
              editor.chain().focus().toggleItalic().run();
            }
          }}
          active={editor?.isActive('italic') || false}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          icon={Strikethrough}
          onClick={() => {
            console.log('Strikethrough clicked');
            if (editor) {
              editor.chain().focus().toggleStrike().run();
            }
          }}
          active={editor?.isActive('strike') || false}
          title="Strikethrough"
        />
        <ToolbarButton
          icon={Code}
          onClick={() => {
            console.log('Code clicked');
            if (editor) {
              editor.chain().focus().toggleCode().run();
            }
          }}
          active={editor?.isActive('code') || false}
          title="Inline Code"
        />

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          icon={Type}
          onClick={() => {
            console.log('Paragraph clicked');
            if (editor) editor.chain().focus().setParagraph().run();
          }}
          active={editor?.isActive('paragraph') || false}
          title="Paragraph"
        />
        <ToolbarButton
          icon={Heading1}
          onClick={() => {
            console.log('Heading 1 clicked');
            if (editor) editor.chain().focus().setHeading({ level: 1 }).run();
          }}
          active={editor?.isActive('heading', { level: 1 }) || false}
          title="Heading 1"
        />
        <ToolbarButton
          icon={Heading2}
          onClick={() => {
            console.log('Heading 2 clicked');
            if (editor) editor.chain().focus().setHeading({ level: 2 }).run();
          }}
          active={editor?.isActive('heading', { level: 2 }) || false}
          title="Heading 2"
        />
        <ToolbarButton
          icon={Heading3}
          onClick={() => {
            console.log('Heading 3 clicked');
            if (editor) editor.chain().focus().setHeading({ level: 3 }).run();
          }}
          active={editor?.isActive('heading', { level: 3 }) || false}
          title="Heading 3"
        />

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          icon={List}
          onClick={() => {
            console.log('Bullet list clicked');
            if (editor) editor.chain().focus().toggleBulletList().run();
          }}
          active={editor?.isActive('bulletList') || false}
          title="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => {
            console.log('Ordered list clicked');
            if (editor) editor.chain().focus().toggleOrderedList().run();
          }}
          active={editor?.isActive('orderedList') || false}
          title="Ordered List"
        />
        <ToolbarButton
          icon={Quote}
          onClick={() => {
            console.log('Quote clicked');
            if (editor) editor.chain().focus().toggleBlockquote().run();
          }}
          active={editor?.isActive('blockquote') || false}
          title="Quote"
        />

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          icon={CornerDownLeft}
          onClick={() => {
            console.log('Code block clicked');
            if (editor) editor.chain().focus().toggleCodeBlock().run();
          }}
          active={editor?.isActive('codeBlock') || false}
          title="Code Block"
        />
        <ToolbarButton
          icon={Minus}
          onClick={() => {
            console.log('Divider clicked');
            if (editor) editor.chain().focus().setHorizontalRule().run();
          }}
          title="Divider"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-white relative">
        <EditorContent editor={editor} />

        {/* Slash Command Menu */}
        {showSlashMenu && slashItems.length > 0 && (
          <SlashCommandMenu
            items={slashItems}
            onSelect={selectCommand}
            selectedIndex={selectedIndex}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
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
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={18} />
    </button>
  );
}
