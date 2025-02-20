import { Request, Response } from 'express';
import { ConfigManager } from '../config/config';

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
    const apiKey = this.configManager.getApiKey();
    console.log('Retrieved API key:', apiKey ? '[PRESENT]' : '[NOT FOUND]');
    res.json({ 
      success: true,
      data: { apiKey: apiKey || '' }
    });
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
      this.configManager.setApiKey(apiKey);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving API key:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save API key' 
      });
    }
  };

  public getModels = (req: Request, res: Response) => {
    const availableModels = [
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.2',
        name: 'Mistral 7B',
        description: 'A powerful language model for general-purpose chat and instruction following.'
      }
    ];
    res.json({ 
      success: true,
      data: {
        models: availableModels,
        currentModel: this.configManager.getModel()
      }
    });
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
      this.configManager.setModel(model);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving model:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save model' 
      });
    }
  };
} 