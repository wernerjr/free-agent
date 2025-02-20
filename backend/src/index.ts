import express from 'express';
import cors from 'cors';
import { SERVER_CONFIG } from './config/server';

// Import routes
import configRoutes from './routes/config.routes';
import chatRoutes from './routes/chat.routes';
import documentRoutes from './routes/document.routes';

const app = express();

// Middleware
app.use(cors({
  origin: SERVER_CONFIG.corsOrigin,
  credentials: true
}));
app.use(express.json());

// UTF-8 headers for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/config', configRoutes);
app.use('/chats', chatRoutes);
app.use('/documents', documentRoutes);

// Start server
app.listen(SERVER_CONFIG.port, () => {
  console.log(`Server is running on port ${SERVER_CONFIG.port}`);
  console.log(`CORS enabled for origin: ${SERVER_CONFIG.corsOrigin}`);
});
