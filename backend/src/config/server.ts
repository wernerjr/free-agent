import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Get workspace root directory (one level up from backend)
const workspaceRoot = path.join(__dirname, '../../../');

export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataPath: {
    chats: path.join(workspaceRoot, 'database/chats.json'),
    documents: path.join(workspaceRoot, 'database/documents.json'),
    config: path.join(workspaceRoot, 'database/config.json')
  }
}; 