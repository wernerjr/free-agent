import { Request, Response, NextFunction } from 'express';
import { ConfigManager } from '../config/config';

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = ConfigManager.getInstance().getApiKey();
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API key not configured' 
    });
  }
  next();
}; 