'use client';
import { Plus, MessageSquare, User, Settings, Trash2 } from 'lucide-react';

export default function ChatSidebar({ conversations, activeConversation, onConversationSelect, onNewChat }) {
  return (
    <div className="w-50 hidden lg:flex bg-base-200 border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <button onClick={onNewChat} className="btn btn-primary w-full gap-2">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 group hover:bg-base-300 ${
                activeConversation === conversation.id ? 'bg-primary text-primary-content' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                    <p className="text-xs opacity-70 truncate">{conversation.lastMessage}</p>
                  </div>
                </div>
                <button className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 cursor-pointer">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8">
              <User size={16} />
            </div>
          </div>
          <div className="text-sm">
            <div className="font-medium">User</div>
            <div className="text-xs opacity-70">Free Plan</div>
          </div>
          <button className="btn btn-ghost btn-xs ml-auto">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
