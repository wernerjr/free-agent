import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { StorageService } from '../services/storage.service';
import { SERVER_CONFIG } from '../config/server';

export class DocumentController {
  private static instance: DocumentController;
  private documentService: DocumentService;

  private constructor() {
    const storageService = StorageService.getInstance(
      SERVER_CONFIG.dataPath.chats,
      SERVER_CONFIG.dataPath.documents
    );
    this.documentService = DocumentService.getInstance(storageService);
  }

  public static getInstance(): DocumentController {
    if (!DocumentController.instance) {
      DocumentController.instance = new DocumentController();
    }
    return DocumentController.instance;
  }

  public getAllDocuments = (req: Request, res: Response) => {
    try {
      const documents = this.documentService.getAllDocuments();
      res.json({ 
        success: true,
        data: { documents }
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch documents' 
      });
    }
  };

  public uploadDocument = (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      // Get the original file name from form data or use the one from multer
      const fileName = req.body.originalFileName || req.file.originalname;

      console.log('Received file:', {
        filename: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const document = this.documentService.createDocument({
        ...req.file,
        originalname: fileName
      });

      console.log('Document stored:', {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size
      });

      const message = `File processed successfully: ${document.name}\nSize: ${this.documentService.formatFileSize(document.size)}`;

      res.json({
        success: true,
        message,
        documentId: document.id
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process uploaded file' 
      });
    }
  };

  public deleteDocument = (req: Request, res: Response) => {
    try {
      const success = this.documentService.deleteDocument(req.params.id);
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          error: 'Document not found' 
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete document' 
      });
    }
  };
} 