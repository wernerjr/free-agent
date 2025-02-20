import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import type { Message, ChatResponse, DocumentResponse } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatProps {
  currentChatId?: string;
  onChatUpdated?: () => void;
}

export function Chat({ currentChatId, onChatUpdated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const fetchMessages = async () => {
    if (!currentChatId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/chats/${currentChatId}`);
      setMessages(response.data.chat.messages);
    } catch (err) {
      setError('Failed to fetch messages. Please try again.');
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentChatId) return;

    const newMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<ChatResponse>('http://localhost:8000/chat', {
        message: input,
        chatId: currentChatId
      });

      setMessages(prev => [...prev, response.data.message]);
      onChatUpdated?.();
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', currentChatId);

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<DocumentResponse>(
        'http://localhost:8000/documents',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Document uploaded: ${response.data.document.name}` }
      ]);
      onChatUpdated?.();
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Error uploading document:', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-auto flex flex-col overflow-hidden bg-secondary-50">
      {/* Messages Area */}
      <div className="flex-auto overflow-y-auto px-6 py-4">
        <div className="max-w-screen-xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 shadow-sm max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-secondary-800'
                } ${message.role === 'assistant' ? 'prose prose-secondary max-w-none' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-secondary max-w-none prose-pre:bg-secondary-800 prose-pre:text-secondary-100"
                    components={{
                      code({className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <div className="relative rounded-lg overflow-hidden my-4 bg-secondary-900">
                            <div className="flex items-center justify-between px-4 py-2 bg-secondary-800 border-b border-secondary-700">
                              <span className="text-sm text-secondary-400">{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!my-0 !bg-transparent"
                              showLineNumbers={true}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={`${className} bg-secondary-100 text-secondary-800 rounded px-1`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex justify-center">
              <div className="bg-white border border-secondary-200 rounded-lg px-4 py-2 shadow-sm">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce delay-75"></div>
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 shadow-sm">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none border-t border-secondary-200 px-6 py-4 bg-white">
        <div className="max-w-screen-xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-none p-2 text-secondary-500 hover:text-primary-600 hover:bg-secondary-50 rounded-full transition-colors"
              aria-label="Attach file"
              disabled={!currentChatId}
            >
              <PaperClipIcon className="h-6 w-6" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentChatId ? "Type your message..." : "Select or create a chat to start messaging"}
              className="flex-auto min-w-0 px-4 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-secondary-800 placeholder-secondary-400"
              disabled={isLoading || !currentChatId}
            />
            <button
              type="submit"
              className="flex-none p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !input.trim() || !currentChatId}
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 