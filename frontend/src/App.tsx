import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHistory } from './components/ChatHistory';
import { Chat } from './pages/Chat';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { Header } from './components/Header';
import { Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import type { Chat as ChatType } from './types';

function App() {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Omit<ChatType, 'messages'>[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/chats');
      const sortedChats = response.data.chats.sort(
        (a: ChatType, b: ChatType) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setChats(sortedChats);
      if (sortedChats.length > 0 && !currentChatId) {
        setCurrentChatId(sortedChats[0].id);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await axios.post<{ chat: ChatType }>('http://localhost:8000/chats');
      const newChat = response.data.chat;
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    } catch (err) {
      console.error('Error creating new chat:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await axios.delete(`http://localhost:8000/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : undefined);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  return (
    <Router>
      <div className="fixed inset-0 flex flex-col bg-dracula-background text-dracula-foreground">
        {/* Main Header */}
        <Header 
          title="Free Agent"
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div
            className={`flex-none transition-all duration-300 ease-in-out ${
              leftSidebarCollapsed ? 'w-20' : 'w-sidebar'
            }`}
          >
            <div className="relative h-full">
              <Sidebar collapsed={leftSidebarCollapsed} />
              <button
                onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 p-1.5 bg-dracula-current border border-dracula-comment rounded-full text-dracula-comment hover:text-dracula-cyan shadow-lg"
              >
                {leftSidebarCollapsed ? (
                  <ChevronDoubleRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <Routes>
              <Route path="/" element={<Chat currentChatId={currentChatId} onChatUpdated={fetchChats} />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>

          {/* Right Sidebar (Chat History) */}
          <div
            className={`flex-none transition-all duration-300 ease-in-out ${
              rightSidebarCollapsed ? 'w-20' : 'w-sidebar'
            }`}
          >
            <div className="relative h-full">
              <ChatHistory 
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={setCurrentChatId}
                onDeleteChat={handleDeleteChat}
                onNewChat={handleNewChat}
                onChatUpdated={fetchChats}
                collapsed={rightSidebarCollapsed}
              />
              <button
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                className="absolute -left-3 top-1/2 transform -translate-y-1/2 p-1.5 bg-dracula-current border border-dracula-comment rounded-full text-dracula-comment hover:text-dracula-cyan shadow-lg"
              >
                {rightSidebarCollapsed ? (
                  <ChevronDoubleLeftIcon className="h-4 w-4" />
                ) : (
                  <ChevronDoubleRightIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
