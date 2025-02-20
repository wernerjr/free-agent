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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileChatHistoryOpen, setIsMobileChatHistoryOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  // Fecha os menus móveis quando mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileChatHistoryOpen(false);
  }, [location.pathname]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/chats');
      const sortedChats = response.data.data.chats.sort(
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
      const response = await axios.post<{ success: boolean; data: { chat: ChatType } }>('http://localhost:8000/chats');
      const newChat = response.data.data.chat;
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setIsMobileChatHistoryOpen(false);
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
          leftControl={
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-dracula-comment hover:text-dracula-cyan"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          }
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Desktop */}
          <div
            className={`hidden lg:flex flex-none transition-all duration-300 ease-in-out ${
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

          {/* Left Sidebar - Mobile */}
          <div
            className={`fixed inset-0 z-40 lg:hidden ${
              isMobileMenuOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-sidebar bg-dracula-current">
              <Sidebar collapsed={false} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden relative">
            <Routes>
              <Route path="/" element={
                <Chat 
                  currentChatId={currentChatId} 
                  onChatUpdated={fetchChats}
                  onOpenChatHistory={() => setIsMobileChatHistoryOpen(true)}
                />
              } />
              <Route path="/documents" element={<Documents />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>

          {/* Right Sidebar (Chat History) - Desktop */}
          <div
            className={`hidden lg:flex flex-none transition-all duration-300 ease-in-out ${
              rightSidebarCollapsed ? 'w-20' : 'w-sidebar'
            }`}
          >
            <div className="relative h-full">
              <ChatHistory 
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={(id) => {
                  setCurrentChatId(id);
                  setIsMobileChatHistoryOpen(false);
                }}
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

          {/* Right Sidebar (Chat History) - Mobile */}
          <div
            className={`fixed inset-0 z-40 lg:hidden ${
              isMobileChatHistoryOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileChatHistoryOpen(false)} />
            <div className="fixed inset-y-0 right-0 w-sidebar bg-dracula-current">
              <ChatHistory 
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={(id) => {
                  setCurrentChatId(id);
                  setIsMobileChatHistoryOpen(false);
                }}
                onDeleteChat={handleDeleteChat}
                onNewChat={handleNewChat}
                onChatUpdated={fetchChats}
                collapsed={false}
              />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
