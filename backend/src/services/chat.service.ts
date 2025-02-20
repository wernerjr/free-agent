import { v4 as uuidv4 } from 'uuid';
import { HfInference } from '@huggingface/inference';
import { Chat, ChatMessage } from '../types';
import { StorageService } from './storage.service';
import { ConfigManager } from '../config/config';

export class ChatService {
  private static instance: ChatService;
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
      const hf = new HfInference(this.configManager.getApiKey());
      const modelId = this.configManager.getModel();

      // Model-specific configurations
      const modelConfigs: Record<string, any> = {
        'mistralai/Mistral-7B-Instruct-v0.2': {
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            return_full_text: false
          },
          inputs: `<|prompter|>${message}<|assistant|>`
        },
        'meta-llama/Llama-2-70b-chat-hf': {
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            return_full_text: false
          },
          inputs: `[INST] ${message} [/INST]`
        },
        'mistralai/Mixtral-8x7B-Instruct-v0.1': {
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            return_full_text: false
          },
          inputs: `<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant`
        },
        'microsoft/phi-2': {
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            return_full_text: false
          },
          inputs: `You are a helpful AI assistant. When providing code examples, always use markdown code blocks with the appropriate language tag.

Instructions: ${message}

Response (remember to use markdown code blocks for any code):
`
        }
      };

      // Check if model is supported
      if (!modelConfigs[modelId]) {
        throw new Error(`Model ${modelId} is not supported`);
      }

      const config = modelConfigs[modelId];
      const response = await hf.textGeneration({
        model: modelId,
        inputs: config.inputs,
        parameters: config.parameters
      });

      const responseTime = Date.now() - startTime;
      let aiResponse = response.generated_text;
      
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
    } catch (error) {
      throw error;
    } finally {
      await writer.close();
    }
  }
} 