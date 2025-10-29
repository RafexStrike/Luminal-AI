'use client';
import { User, Bot, Copy, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ChatWindow({ messages }) {
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // Optional: Auto-scroll when user is near bottom
  const shouldAutoScroll = () => {
    if (!chatContainerRef.current) return true;
    
    const container = chatContainerRef.current;
    const threshold = 100; // pixels from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    return distanceFromBottom <= threshold;
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Manual scroll to bottom button
  const ScrollToBottomButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        if (!chatContainerRef.current) return;
        
        const container = chatContainerRef.current;
        const threshold = 200; // Show button when 200px from bottom
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        
        setIsVisible(distanceFromBottom > threshold);
      };

      const container = chatContainerRef.current;
      container?.addEventListener('scroll', handleScroll);
      return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
      <button
        onClick={scrollToBottom}
        className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
        title="Scroll to latest message"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 14l-7 7m0 0l-7-7m7 7V3" 
          />
        </svg>
      </button>
    );
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`group relative mb-6 transition-all duration-200 ${
              message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`relative max-w-[85%] rounded-3xl px-6 py-4 shadow-lg transition-all duration-200 hover:shadow-xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-emerald-400 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-md'
              } ${index === messages.length - 1 ? 'animate-in fade-in-50' : ''}`}
            >
              
              {/* Avatar */}
              <div
                className={`absolute top-3 ${
                  message.sender === 'user' ? '-right-2' : '-left-2'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                      : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>
              </div>

              {/* Message Header */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`font-semibold text-sm ${
                    message.sender === 'user'
                      ? 'text-blue-100'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {message.sender === 'user' ? 'You' : 'Luminal'}
                </span>
                <span
                  className={`text-xs ${
                    message.sender === 'user'
                      ? 'text-blue-200'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>

              {/* Message Content */}
              <div
                className={`text-sm leading-relaxed ${
                  message.sender === 'user' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {message.content}
              </div>

              {/* Copy Button - Only for assistant messages */}
              {message.sender === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className={`absolute -bottom-2 ${
                    message.sender === 'user' ? 'left-4' : 'right-4'
                  } opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 hover:scale-110`}
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <CheckCheck size={12} className="text-green-500" />
                  ) : (
                    <Copy size={12} className="text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              )}
            </div>

            {/* Typing indicator for last assistant message if it's being generated */}
            {message.sender === 'assistant' && index === messages.length - 1 && message.isTyping && (
              <div className="flex space-x-1 mt-2 ml-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
              <Bot size={32} className="text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Ask me anything and I'll do my best to help you with your questions and tasks.
            </p>
          </div>
        )}

        {/* Invisible element at the bottom for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton />
    </div>
  );
}