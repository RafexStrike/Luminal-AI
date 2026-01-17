'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * MarkdownRenderer
 * - Reusable markdown + code renderer used across chat and summary panels
 * - Mirrors rendering behavior from `SECONDARY_ChatWindow.jsx`
 */
export default function MarkdownRenderer({ content = '', className = '' }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');

            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md border border-gray-200 my-4"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className || ''} bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono`} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-500 underline" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-200 pl-4 py-1 italic bg-gray-50 rounded-r my-4" {...props} />,
          table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 border border-gray-200" {...props} /></div>,
          th: ({ node, ...props }) => <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap border-t border-gray-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
