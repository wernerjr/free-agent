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
        },
        {
          id: 'meta-llama/Llama-2-70b-chat-hf',
          name: 'Llama 2 70B',
          description: 'Meta\'s largest chat model with exceptional performance across various tasks.',
          isPro: true
        },
        {
          id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          name: 'Mixtral 8x7B',
          description: 'Advanced mixture-of-experts model with state-of-the-art performance.',
          isPro: true
        },
        {
          id: 'microsoft/phi-2',
          name: 'Phi-2',
          description: 'Compact yet powerful model from Microsoft Research.',
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