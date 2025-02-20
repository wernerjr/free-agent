export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  answer: string;
  chatId: string;
  error?: string;
}

export interface DocumentResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  content?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface ChatListResponse {
  chats: Omit<Chat, 'messages'>[];
}

export interface ChatDetailResponse {
  chat: Chat;
} 