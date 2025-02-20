export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  model?: string;
  responseTime?: number;  // tempo em milissegundos
}

export interface ChatResponse {
  message: Message;
  chatId: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  createdAt: Date;
}

export interface DocumentResponse {
  success: boolean;
  message: string;
  documentId: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  messageCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface ChatListResponse {
  chats: Omit<Chat, 'messages'>[];
}

export interface ChatDetailResponse {
  chat: Chat;
} 