import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import type { Message, ChatResponse, DocumentResponse } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface ChatProps {
  currentChatId?: string;
  onChatUpdated?: () => void;
  onOpenChatHistory?: () => void;
}

interface Model {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
}

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      type === 'success' 
        ? 'bg-dracula-green text-dracula-background' 
        : 'bg-dracula-red text-dracula-foreground'
    }`}>
      {message}
    </div>
  );
}

export function Chat({ currentChatId, onChatUpdated, onOpenChatHistory }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [currentModel, setCurrentModel] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const fetchModels = async () => {
    try {
      const response = await axios.get('http://localhost:8000/config/models');
      setModels(response.data.data.models);
      setCurrentModel(response.data.data.currentModel);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models');
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      await axios.post('http://localhost:8000/config/model', { model: modelId });
      setCurrentModel(modelId);
      setToast({
        message: 'Model updated successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating model:', err);
      setToast({
        message: 'Failed to update model',
        type: 'error'
      });
    }
  };

  const fetchMessages = async () => {
    if (!currentChatId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/chats/${currentChatId}`);
      const messages = response.data.data?.chat?.messages || [];
      setMessages(Array.isArray(messages) ? messages : []);
    } catch (err) {
      setError('Failed to fetch messages. Please try again.');
      console.error('Error fetching messages:', err);
      setMessages([]);
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
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Create a temporary message for streaming
      const tempMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: currentModel
      };
      setMessages(prev => [...prev, tempMessage]);

      let streamedContent = '';

      // Create EventSource for streaming
      const eventSource = new EventSource(
        `http://localhost:8000/chats/chat?message=${encodeURIComponent(input)}&chatId=${currentChatId}`
      );
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chunk') {
          // Append new content to the streamed content
          streamedContent += data.content;
          
          // Update the temporary message with accumulated content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = streamedContent;
            }
            return newMessages;
          });
        } else if (data.type === 'done') {
          // Update the message with all metadata from the server
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.timestamp = new Date(data.message.timestamp);
              lastMessage.model = data.message.model;
              lastMessage.responseTime = data.message.responseTime;
            }
            return newMessages;
          });
          eventSource.close();
          onChatUpdated?.();
          setIsLoading(false);
        } else if (data.type === 'error') {
          // Handle error from server
          setError(data.message);
          // Remove the temporary message
          setMessages(prev => prev.slice(0, -1));
          eventSource.close();
          setIsLoading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        // Remove the temporary message
        setMessages(prev => prev.slice(0, -1));
        setError('Failed to receive message stream. Please check if your API key is configured correctly.');
        setIsLoading(false);
      };
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatId) return;

    const formData = new FormData();
    // Create a new File object with UTF-8 encoded name
    const encodedFile = new File([file], file.name, {
      type: file.type,
    });
    formData.append('file', encodedFile);
    formData.append('chatId', currentChatId);
    formData.append('originalFileName', file.name); // Send original file name separately

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<DocumentResponse>(
        'http://localhost:8000/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setToast({
          message: `File "${file.name}" uploaded successfully`,
          type: 'success'
        });
        onChatUpdated?.();
      }
    } catch (err) {
      setToast({
        message: 'Failed to upload file. Please try again.',
        type: 'error'
      });
      console.error('Error uploading document:', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex-auto flex flex-col overflow-hidden bg-dracula-background">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Messages Area */}
      <div className="flex-auto overflow-y-auto px-3 sm:px-6 py-4">
        <div className="max-w-screen-xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-3 sm:px-4 py-2 shadow-lg max-w-[85%] sm:max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-dracula-purple text-dracula-foreground'
                    : 'bg-dracula-current text-dracula-foreground'
                } ${message.role === 'assistant' ? 'prose prose-dracula max-w-none' : ''}`}
              >
                {message.role === 'assistant' && message.model && (
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-dracula-comment">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-dracula-background rounded-full text-xs">
                        Mistral 7B
                      </span>
                      {message.responseTime && (
                        <span className="px-2 py-0.5 bg-dracula-background rounded-full text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {(message.responseTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="prose prose-dracula max-w-none prose-pre:bg-dracula-background prose-pre:text-dracula-foreground prose-sm sm:prose-base"
                    components={{
                      code({className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <div className="relative rounded-lg overflow-hidden my-4 bg-dracula-background">
                            <div className="flex items-center justify-between px-4 py-2 bg-dracula-current border-b border-dracula-comment/20">
                              <span className="text-sm text-dracula-comment">{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!my-0 !bg-transparent text-sm"
                              showLineNumbers={true}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={`${className} bg-dracula-background text-dracula-green rounded px-1 text-sm`} {...props}>
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
              <div className="bg-dracula-current border border-dracula-comment/20 rounded-lg px-4 py-2 shadow-lg">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-dracula-purple rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-dracula-purple rounded-full animate-bounce delay-75"></div>
                  <div className="h-2 w-2 bg-dracula-purple rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="bg-dracula-background border border-dracula-red/20 text-dracula-red rounded-lg px-4 py-2 shadow-lg">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none border-t border-dracula-comment/20 px-3 sm:px-6 py-4 bg-dracula-current">
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
              className="flex-none p-2 text-dracula-comment hover:text-dracula-cyan hover:bg-dracula-background rounded-full transition-colors"
              aria-label="Attach file"
              disabled={!currentChatId}
            >
              <PaperClipIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Model Info */}
            <div className="hidden sm:flex flex-none px-3 py-2 bg-dracula-background border border-dracula-comment/20 rounded-lg text-dracula-foreground">
              <div className="flex items-center gap-2">
                <span className="text-sm">Mistral 7B</span>
              </div>
            </div>

            {/* Chat History Button - Mobile */}
            <button
              type="button"
              onClick={onOpenChatHistory}
              className="lg:hidden flex-none p-2 text-dracula-comment hover:text-dracula-cyan hover:bg-dracula-background rounded-full transition-colors"
            >
              <ChatBubbleLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentChatId ? "Type your message..." : "Select or create a chat to start messaging"}
              className="flex-auto min-w-0 px-3 sm:px-4 py-2 bg-dracula-background border border-dracula-comment/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-dracula-purple focus:border-transparent text-dracula-foreground placeholder-dracula-comment text-sm sm:text-base"
              disabled={isLoading || !currentChatId}
            />
            <button
              type="submit"
              className="flex-none p-2 text-dracula-purple hover:text-dracula-pink hover:bg-dracula-background rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !input.trim() || !currentChatId}
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 