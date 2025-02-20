import fs from 'fs';
import path from 'path';
import { Chat, StoredDocument } from '../types';

export class StorageService {
  private static instance: StorageService;
  private chatsPath: string;
  private documentsPath: string;

  private constructor(chatsPath: string, documentsPath: string) {
    this.chatsPath = chatsPath;
    this.documentsPath = documentsPath;
    this.ensureDirectoryExists();
  }

  public static getInstance(chatsPath: string, documentsPath: string): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService(chatsPath, documentsPath);
    }
    return StorageService.instance;
  }

  private ensureDirectoryExists(): void {
    const chatsDir = path.dirname(this.chatsPath);
    const documentsDir = path.dirname(this.documentsPath);
    
    // Create database directory if it doesn't exist
    [chatsDir, documentsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  // Chat Storage Methods
  public saveChats(chats: Chat[]): void {
    try {
      this.ensureDirectoryExists();
      fs.writeFileSync(this.chatsPath, JSON.stringify(chats, null, 2));
    } catch (error) {
      console.error('Error saving chats:', error);
      throw new Error('Failed to save chats');
    }
  }

  public loadChats(): Chat[] {
    try {
      this.ensureDirectoryExists();
      if (fs.existsSync(this.chatsPath)) {
        const data = fs.readFileSync(this.chatsPath, 'utf8');
        const loadedChats = JSON.parse(data);
        // Convert date strings to Date objects
        return loadedChats.map((chat: Chat) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
    return [];
  }

  // Document Storage Methods
  public saveDocuments(documents: StoredDocument[]): void {
    try {
      this.ensureDirectoryExists();
      fs.writeFileSync(this.documentsPath, JSON.stringify(documents, null, 2));
    } catch (error) {
      console.error('Error saving documents:', error);
      throw new Error('Failed to save documents');
    }
  }

  public loadDocuments(): StoredDocument[] {
    try {
      this.ensureDirectoryExists();
      if (fs.existsSync(this.documentsPath)) {
        const data = fs.readFileSync(this.documentsPath, 'utf8');
        const loadedDocuments = JSON.parse(data);
        // Convert date strings to Date objects
        return loadedDocuments.map((doc: StoredDocument) => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt)
        }));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
    return [];
  }
} 