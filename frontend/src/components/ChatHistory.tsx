import { ChatBubbleLeftIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Chat } from '../types';
import { useState } from 'react';
import axios from 'axios';

interface ChatHistoryProps {
  chats: Omit<Chat, 'messages'>[];
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
  onChatUpdated?: () => void;
  collapsed: boolean;
}

export function ChatHistory({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onDeleteChat, 
  onNewChat,
  onChatUpdated,
  collapsed 
}: ChatHistoryProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditClick = (chat: Omit<Chat, 'messages'>, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setIsEditing(true);
  };

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChatId || !editingTitle.trim()) return;

    try {
      await axios.put(`http://localhost:8000/chats/${editingChatId}/title`, {
        title: editingTitle
      });
      
      setEditingChatId(null);
      setEditingTitle('');
      setIsEditing(false);
      
      onChatUpdated?.();
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  return (
    <aside className="h-full bg-dracula-current border-l border-dracula-comment/20">
      <div className="flex flex-col h-full">
        <div className="flex-none p-3 sm:p-4 border-b border-dracula-comment/20">
          <button
            onClick={onNewChat}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-dracula-purple text-dracula-foreground rounded-lg hover:bg-dracula-pink transition-colors ${
              collapsed ? 'w-12 h-12 p-0' : 'w-full'
            }`}
            title={collapsed ? 'New Chat' : undefined}
          >
            <ChatBubbleLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            {!collapsed && <span className="text-sm sm:text-base">New Chat</span>}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg transition-colors ${
                  chat.id === currentChatId
                    ? 'bg-dracula-background text-dracula-pink'
                    : 'hover:bg-dracula-background text-dracula-foreground hover:text-dracula-cyan'
                } ${collapsed ? 'h-12' : 'p-2 sm:p-3'}`}
                onClick={() => onSelectChat(chat.id)}
              >
                {!collapsed ? (
                  <div className="flex flex-col pr-14 sm:pr-16">
                    {editingChatId === chat.id ? (
                      <form onSubmit={handleTitleSubmit} className="flex items-center">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dracula-current border border-dracula-purple rounded text-dracula-foreground text-sm"
                          autoFocus
                          onBlur={handleTitleSubmit}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </form>
                    ) : (
                      <>
                        <span className="font-medium truncate text-sm sm:text-base">{chat.title}</span>
                        <span className="text-xs sm:text-sm text-dracula-comment">
                          {chat.messageCount} messages • {formatDate(chat.updatedAt)}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </div>
                  </div>
                )}
                
                {!collapsed && !isEditing && (
                  <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={(e) => handleEditClick(chat, e)}
                      className="p-1 rounded-full transition-colors text-dracula-comment hover:text-dracula-cyan hover:bg-dracula-background opacity-0 group-hover:opacity-100"
                      title="Rename chat"
                    >
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 rounded-full transition-colors text-dracula-comment hover:text-dracula-red hover:bg-dracula-background opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
} 