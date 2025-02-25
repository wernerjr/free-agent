import { Request, Response } from 'express';
import { ConfigManager } from '../config/config';
import { ChatService } from '../services/chat.service';

export class ConfigController {
  private static instance: ConfigController;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  public static getInstance(): ConfigController {
    if (!ConfigController.instance) {
      ConfigController.instance = new ConfigController();
    }
    return ConfigController.instance;
  }

  public getApiKey = (req: Request, res: Response) => {
    try {
      const apiKey = this.configManager.getApiKey();
      console.log('Retrieved API key:', apiKey ? '[PRESENT]' : '[NOT FOUND]');
      res.json({ 
        success: true,
        data: { apiKey }
      });
    } catch (error) {
      console.error('Error retrieving API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve API key' 
      });
    }
  };

  public setApiKey = (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'API key is required' 
        });
      }

      console.log('Setting new API key');
      this.configManager.setApiKey(apiKey);
      
      console.log('API key saved successfully');
      res.json({ 
        success: true,
        message: 'API key saved successfully'
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save API key' 
      });
    }
  };

  public getModels = (req: Request, res: Response) => {
    try {
      const currentModel = this.configManager.getModel();
      console.log('Current model:', currentModel);

      const availableModels = [
        {
          id: 'mistralai/Mistral-7B-Instruct-v0.2',
          name: 'Mistral 7B',
          description: 'A powerful language model for general-purpose chat and instruction following.',
          isPro: false
        }
      ];

      res.json({ 
        success: true,
        data: {
          models: availableModels,
          currentModel
        }
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch models' 
      });
    }
  };

  public setModel = (req: Request, res: Response) => {
    try {
      const { model } = req.body;
      if (!model) {
        return res.status(400).json({ 
          success: false, 
          error: 'Model is required' 
        });
      }

      console.log('Setting new model:', model);
      this.configManager.setModel(model);
      
      // Clear ChatService instance to force a refresh with the new model
      ChatService.clearInstance();
      
      console.log('Model updated successfully');
      res.json({ 
        success: true,
        message: 'Model updated successfully'
      });
    } catch (error) {
      console.error('Error saving model:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save model' 
      });
    }
  };
} 