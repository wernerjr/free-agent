import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { HfInference } from '@huggingface/inference';
import { ConfigManager } from './config';
import { v4 as uuidv4 } from 'uuid';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;

// Configurar o multer para lidar com nomes de arquivo em UTF-8
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Garantir que o nome do arquivo esteja em UTF-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
  }
});

const configManager = ConfigManager.getInstance();
const CHATS_FILE = path.join(__dirname, '../chats.json');
const DOCUMENTS_FILE = path.join(__dirname, '../documents.json');

// Interfaces
interface StoredDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Função para salvar os chats em arquivo
const saveChats = () => {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
  } catch (error) {
    console.error('Error saving chats:', error);
  }
};

// Função para carregar os chats do arquivo
const loadChats = () => {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, 'utf8');
      const loadedChats = JSON.parse(data);
      // Converter as strings de data para objetos Date
      loadedChats.forEach((chat: Chat) => {
        chat.createdAt = new Date(chat.createdAt);
        chat.updatedAt = new Date(chat.updatedAt);
        chat.messages.forEach((msg: ChatMessage) => {
          msg.timestamp = new Date(msg.timestamp);
        });
      });
      return loadedChats;
    }
  } catch (error) {
    console.error('Error loading chats:', error);
  }
  return [];
};

// Função para salvar os documentos em arquivo
const saveDocuments = () => {
  try {
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
  } catch (error) {
    console.error('Error saving documents:', error);
  }
};

// Função para carregar os documentos do arquivo
const loadDocuments = () => {
  try {
    if (fs.existsSync(DOCUMENTS_FILE)) {
      const data = fs.readFileSync(DOCUMENTS_FILE, 'utf8');
      const loadedDocuments = JSON.parse(data);
      // Converter as strings de data para objetos Date
      loadedDocuments.forEach((doc: StoredDocument) => {
        doc.uploadedAt = new Date(doc.uploadedAt);
      });
      return loadedDocuments;
    }
  } catch (error) {
    console.error('Error loading documents:', error);
  }
  return [];
};

// Armazenamento em memória
const documents: StoredDocument[] = loadDocuments();
const chats: Chat[] = loadChats();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Middleware para garantir UTF-8 em todas as respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middleware para verificar a API key
const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = configManager.getApiKey();
  if (!apiKey) {
    return res.status(401).json({ error: 'API key not configured' });
  }
  next();
};

// Rotas de configuração
app.get('/config/api-key', (req, res) => {
  const apiKey = configManager.getApiKey();
  console.log('Retrieved API key:', apiKey ? '[PRESENT]' : '[NOT FOUND]');
  res.json({ apiKey: apiKey || '' });
});

app.post('/config/api-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    configManager.setApiKey(apiKey);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

app.get('/config/models', (req, res) => {
  const availableModels = [
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.2',
      name: 'Mistral 7B',
      description: 'A powerful language model for general-purpose chat and instruction following.'
    }
  ];
  res.json({ models: availableModels, currentModel: configManager.getModel() });
});

app.post('/config/model', (req, res) => {
  try {
    const { model } = req.body;
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    configManager.setModel(model);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving model:', error);
    res.status(500).json({ error: 'Failed to save model' });
  }
});

// Rotas de documentos
app.get('/documents', (req, res) => {
  try {
    // Mapear os documentos para remover o conteúdo antes de enviar
    const documentsWithoutContent = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      type: doc.type,
      uploadedAt: doc.uploadedAt
    }));
    
    console.log('Sending documents:', documentsWithoutContent);
    
    // Adicionar headers UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ documents: documentsWithoutContent });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

app.delete('/documents/:id', (req, res) => {
  const { id } = req.params;
  const index = documents.findIndex(doc => doc.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  documents.splice(index, 1);
  saveDocuments(); // Salvar os documentos após deletar
  res.json({ success: true });
});

// Rotas de chat
app.get('/chats', (req, res) => {
  // Retorna apenas os metadados dos chats, sem as mensagens
  const chatList = chats.map(chat => ({
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length
  }));
  res.json({ chats: chatList });
});

app.get('/chats/:id', (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  res.json({ chat });
});

app.post('/chats', (req, res) => {
  const newChat: Chat = {
    id: uuidv4(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  chats.push(newChat);
  saveChats();
  res.json({ chat: newChat });
});

app.put('/chats/:id/title', (req, res) => {
  const { title } = req.body;
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  chat.title = title;
  chat.updatedAt = new Date();
  saveChats();
  res.json({ success: true });
});

app.delete('/chats/:id', (req, res) => {
  const index = chats.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  chats.splice(index, 1);
  saveChats();
  res.json({ success: true });
});

// Atualizar a rota de chat existente
app.get('/chat', requireApiKey, async (req, res) => {
  try {
    const { message, chatId } = req.query;
    
    if (!message || !chatId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add user message to chat
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message as string,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);
    saveChats();

    // Simulate AI response generation
    const hf = new HfInference(configManager.getApiKey());
    
    try {
      const response = await hf.textGeneration({
        model: configManager.getModel(),
        inputs: message as string,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1,
        }
      });

      // Remover a entrada da resposta e limpar duplicações
      let aiResponse = response.generated_text;
      const userMessageStr = message as string;
      
      // Se a resposta começa com a mensagem do usuário, remova-a
      if (aiResponse.startsWith(userMessageStr)) {
        aiResponse = aiResponse.substring(userMessageStr.length).trim();
      }
      
      // Remover duplicações de palavras no início
      const words = aiResponse.split(' ').filter(word => word.length > 0);
      
      for (const word of words) {
        // Send each word as a Server-Sent Event
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: word + ' ' })}\n\n`);
        // Add a small delay between words
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Send completion event
      const finalMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      chat.messages.push(finalMessage);
      chat.updatedAt = new Date();
      saveChats();

      res.write(`data: ${JSON.stringify({ type: 'done', message: finalMessage })}\n\n`);
      res.end();
    } catch (aiError) {
      console.error('Error calling AI service:', aiError);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate AI response' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`);
    res.end();
  }
});

// Atualizar a rota de upload para salvar os documentos
app.post('/upload', requireApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    // O nome do arquivo já está em UTF-8 devido à configuração do multer
    const fileName = req.file.originalname;

    console.log('Received file:', {
      filename: fileName,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    let fileContent = '';
    if (req.file.mimetype === 'application/pdf') {
      fileContent = '[PDF Content]';
    } else {
      try {
        // Garantir que o conteúdo do arquivo também esteja em UTF-8
        fileContent = Buffer.from(req.file.buffer).toString('utf8');
      } catch (error) {
        console.error('Error converting file to text:', error);
        fileContent = '[Binary Content]';
      }
    }

    const document: StoredDocument = {
      id: uuidv4(),
      name: fileName,
      size: req.file.size,
      type: req.file.mimetype,
      content: fileContent,
      uploadedAt: new Date()
    };

    documents.push(document);
    saveDocuments();

    console.log('Document stored:', {
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size
    });

    // Criar mensagem formatada
    const message = `File processed successfully: ${fileName}\nSize: ${formatFileSize(req.file.size)}`;

    res.json({
      success: true,
      message,
      documentId: document.id
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

// Função auxiliar para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`CORS enabled for origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
}); 