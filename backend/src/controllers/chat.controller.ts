import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { StorageService } from '../services/storage.service';
import { ConfigManager } from '../config/config';
import { SERVER_CONFIG } from '../config/server';

export class ChatController {
  private static instance: ChatController;
  private chatService: ChatService;

  private constructor() {
    const storageService = StorageService.getInstance(
      SERVER_CONFIG.dataPath.chats,
      SERVER_CONFIG.dataPath.documents
    );
    const configManager = ConfigManager.getInstance();
    this.chatService = ChatService.getInstance(storageService, configManager);
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public getAllChats = (req: Request, res: Response) => {
    try {
      const chats = this.chatService.getAllChats();
      res.json({ 
        success: true,
        data: { chats }
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch chats' 
      });
    }
  };

  public getChatById = (req: Request, res: Response) => {
    try {
      const chat = this.chatService.getChatById(req.params.id);
      if (!chat) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chat not found' 
        });
      }
      res.json({ 
        success: true,
        data: { chat }
      });
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch chat' 
      });
    }
  };

  public createChat = (req: Request, res: Response) => {
    try {
      const chat = this.chatService.createChat();
      res.json({ 
        success: true,
        data: { chat }
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create chat' 
      });
    }
  };

  public updateChatTitle = (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const success = this.chatService.updateChatTitle(req.params.id, title);
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chat not found' 
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating chat title:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update chat title' 
      });
    }
  };

  public deleteChat = (req: Request, res: Response) => {
    try {
      const success = this.chatService.deleteChat(req.params.id);
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          error: 'Chat not found' 
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete chat' 
      });
    }
  };

  public processMessage = async (req: Request, res: Response) => {
    try {
      const { message, chatId } = req.query;
      if (!message || !chatId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters' 
        });
      }

      const response = await this.chatService.processMessage(
        chatId as string,
        message as string
      );

      // Copy headers from the streaming response
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }

      // Pipe the response stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error) {
      console.error('Error processing message:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process message' 
      })}\n\n`);
      res.end();
    }
  };
} 