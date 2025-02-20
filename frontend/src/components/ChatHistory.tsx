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
      
      // Atualizar o título localmente
      const updatedChats = chats.map(chat => 
        chat.id === editingChatId ? { ...chat, title: editingTitle } : chat
      );
      
      // Limpar o estado de edição
      setEditingChatId(null);
      setEditingTitle('');
      setIsEditing(false);
      
      // Notificar o componente pai sobre a atualização
      onChatUpdated?.();
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  return (
    <aside className="h-full bg-dracula-current border-l border-dracula-comment/20">
      <div className="flex flex-col h-full">
        <div className="flex-none p-4 border-b border-dracula-comment/20">
          <button
            onClick={onNewChat}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-dracula-purple text-dracula-foreground rounded-lg hover:bg-dracula-pink transition-colors ${
              collapsed ? 'w-12 h-12 p-0' : 'w-full'
            }`}
            title={collapsed ? 'New Chat' : undefined}
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg transition-colors ${
                  chat.id === currentChatId
                    ? 'bg-dracula-background text-dracula-pink'
                    : 'hover:bg-dracula-background text-dracula-foreground hover:text-dracula-cyan'
                } ${collapsed ? 'h-12' : 'p-3'}`}
                onClick={() => onSelectChat(chat.id)}
              >
                {!collapsed ? (
                  <div className="flex flex-col pr-16">
                    {editingChatId === chat.id ? (
                      <form onSubmit={handleTitleSubmit} className="flex items-center">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dracula-current border border-dracula-purple rounded text-dracula-foreground"
                          autoFocus
                          onBlur={handleTitleSubmit}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </form>
                    ) : (
                      <>
                        <span className="font-medium truncate">{chat.title}</span>
                        <span className="text-sm text-dracula-comment">
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
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={(e) => handleEditClick(chat, e)}
                      className="p-1 rounded-full transition-colors text-dracula-comment hover:text-dracula-cyan hover:bg-dracula-background opacity-0 group-hover:opacity-100"
                      title="Rename chat"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 rounded-full transition-colors text-dracula-comment hover:text-dracula-red hover:bg-dracula-background opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <TrashIcon className="h-5 w-5" />
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