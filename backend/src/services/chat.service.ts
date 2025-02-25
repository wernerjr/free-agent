import { v4 as uuidv4 } from 'uuid';
import { HfInference } from '@huggingface/inference';
import { Chat, ChatMessage } from '../types';
import { StorageService } from './storage.service';
import { ConfigManager } from '../config/config';

export class ChatService {
  private static instance: ChatService | null = null;
  private chats: Chat[];
  private storageService: StorageService;
  private configManager: ConfigManager;

  private constructor(storageService: StorageService, configManager: ConfigManager) {
    this.storageService = storageService;
    this.configManager = configManager;
    this.chats = this.storageService.loadChats();
  }

  public static getInstance(storageService: StorageService, configManager: ConfigManager): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService(storageService, configManager);
    }
    return ChatService.instance;
  }

  public static clearInstance(): void {
    ChatService.instance = null;
  }

  private validateModelConfig(modelId: string): void {
    const supportedModels = [
      'mistralai/Mistral-7B-Instruct-v0.2'
    ] as const;

    if (!supportedModels.includes(modelId as any)) {
      throw new Error(`Model ${modelId} is not supported. Only Mistral 7B is available.`);
    }
  }

  private getModelConfig(modelId: string, message: string, conversationHistory: string) {
    type ModelConfig = {
      inputs: string;
      parameters: {
        max_new_tokens: number;
        temperature: number;
        top_p: number;
        repetition_penalty: number;
        return_full_text: boolean;
      };
    };

    // Calculate approximate token count (rough estimation)
    const estimatedInputTokens = Math.ceil((message.length + conversationHistory.length) / 4);
    
    // Maximum context length for the models
    const MAX_CONTEXT_LENGTH = 2048;
    
    // Calculate max_new_tokens dynamically
    const max_new_tokens = Math.min(
      1024,
      Math.max(
        256,
        MAX_CONTEXT_LENGTH - estimatedInputTokens - 50
      )
    );

    const baseConfig = {
      parameters: {
        max_new_tokens,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    };

    // Truncate conversation history if it's too long
    const truncatedHistory = conversationHistory.length > 6000 
      ? conversationHistory.slice(-6000) + "\n[Earlier conversation history truncated]"
      : conversationHistory;

    return {
      ...baseConfig,
      inputs: `<|system|>You are a direct and focused AI assistant. Provide concise responses that directly address the user's question. Maintain the conversation context but avoid unnecessary information. Always respond in the same language as the user's message.

Rules:
1. Answer only what was asked
2. Keep responses focused and to the point
3. Use the chat history for context only when relevant
4. Match the user's language (English or Portuguese)
5. No greetings or unnecessary phrases

Previous conversation:
${truncatedHistory}

<|prompter|>${message}<|assistant|>`
    };
  }

  public getAllChats(): Omit<Chat, 'messages'>[] {
    return this.chats.map(({ messages, ...chat }) => ({
      ...chat,
      messageCount: messages.length
    }));
  }

  public getChatById(id: string): Chat | undefined {
    return this.chats.find(chat => chat.id === id);
  }

  public createChat(): Chat {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chats.push(newChat);
    this.storageService.saveChats(this.chats);
    return newChat;
  }

  public updateChatTitle(id: string, title: string): boolean {
    const chat = this.chats.find(c => c.id === id);
    if (!chat) return false;
    
    chat.title = title;
    chat.updatedAt = new Date();
    this.storageService.saveChats(this.chats);
    return true;
  }

  public deleteChat(id: string): boolean {
    const index = this.chats.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.chats.splice(index, 1);
    this.storageService.saveChats(this.chats);
    return true;
  }

  public async processMessage(chatId: string, message: string): Promise<Response> {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);
    this.storageService.saveChats(this.chats);

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process in background
    this.generateAIResponse(chat, message, writer).catch(error => {
      console.error('Error generating AI response:', error);
      const encoder = new TextEncoder();
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate AI response' })}\n\n`));
      writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  private async generateAIResponse(
    chat: Chat, 
    message: string, 
    writer: WritableStreamDefaultWriter
  ): Promise<void> {
    const encoder = new TextEncoder();
    const startTime = Date.now();
    try {
      const modelId = this.configManager.getModel();
      this.validateModelConfig(modelId);

      const hf = new HfInference(this.configManager.getApiKey());

      // Format conversation history
      const conversationHistory = chat.messages.map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        // Remove prompt markers from the content
        const content = msg.content.replace(/<\|assistant\|>/g, '').replace(/<\|prompter\|>/g, '').trim();
        return `${role}: ${content}`;
      }).join('\n\n');

      const config = this.getModelConfig(modelId, message, conversationHistory);

      const response = await hf.textGeneration({
        model: modelId,
        inputs: config.inputs,
        parameters: config.parameters
      });

      const responseTime = Date.now() - startTime;
      // Clean up the response text by removing all tags and prefixes
      let aiResponse = response.generated_text;
      
      // First try to extract content between assistant tags
      const assistantMatch = aiResponse.match(/<\|assistant\|>(.*?)(?:<\|.*?\|>|$)/s);
      if (assistantMatch) {
        aiResponse = assistantMatch[1];
      }
      
      // Then clean up any remaining markers or prefixes
      aiResponse = aiResponse.trim();
      
      try {
        // Stream response word by word
        const words = aiResponse.split(' ').filter(word => word.length > 0);
        for (const word of words) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: word + ' ' })}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Save final message
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          model: modelId,
          responseTime
        };

        chat.messages.push(finalMessage);
        chat.updatedAt = new Date();
        this.storageService.saveChats(this.chats);

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', message: finalMessage })}\n\n`));
      } catch (streamError) {
        console.error('Error writing to stream:', streamError);
        // Try to send error message if stream is still writable
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Failed to stream response' 
          })}\n\n`));
        } catch (e) {
          console.error('Failed to write error to stream:', e);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Try to send error message if stream is still writable
      try {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI response';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          message: errorMessage 
        })}\n\n`));
      } catch (e) {
        console.error('Failed to write error to stream:', e);
      }
    } finally {
      try {
        await writer.close();
      } catch (e) {
        console.error('Error closing writer:', e);
      }
    }
  }
}