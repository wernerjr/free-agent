import { v4 as uuidv4 } from 'uuid';
import { StoredDocument } from '../types';
import { StorageService } from './storage.service';

export class DocumentService {
  private static instance: DocumentService;
  private documents: StoredDocument[];
  private storageService: StorageService;

  private constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.documents = this.storageService.loadDocuments();
  }

  public static getInstance(storageService: StorageService): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService(storageService);
    }
    return DocumentService.instance;
  }

  public getAllDocuments(): Omit<StoredDocument, 'content'>[] {
    return this.documents.map(({ content, ...doc }) => ({
      ...doc,
      name: decodeURIComponent(doc.name)
    }));
  }

  public getDocumentById(id: string): StoredDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  public createDocument(file: Express.Multer.File): StoredDocument {
    const fileName = file.originalname;
    let fileContent = '';

    if (file.mimetype === 'application/pdf') {
      fileContent = '[PDF Content]';
    } else {
      try {
        fileContent = Buffer.from(file.buffer).toString('utf8');
      } catch (error) {
        console.error('Error converting file to text:', error);
        fileContent = '[Binary Content]';
      }
    }

    const document: StoredDocument = {
      id: uuidv4(),
      name: encodeURIComponent(fileName),
      size: file.size,
      type: file.mimetype,
      content: fileContent,
      uploadedAt: new Date()
    };

    this.documents.push(document);
    this.storageService.saveDocuments(this.documents);
    return document;
  }

  public deleteDocument(id: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    
    this.documents.splice(index, 1);
    this.storageService.saveDocuments(this.documents);
    return true;
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 