import fs from 'fs';
import path from 'path';
import { Config } from '../types';
import { SERVER_CONFIG } from './server';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private configPath: string;

  private constructor() {
    this.configPath = SERVER_CONFIG.dataPath.config;
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Load or create default config
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(data);
        return {
          apiKey: loadedConfig.apiKey || '',
          model: loadedConfig.model || 'mistralai/Mistral-7B-Instruct-v0.2'
        };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Return default config if loading fails
    return {
      apiKey: '',
      model: 'mistralai/Mistral-7B-Instruct-v0.2'
    };
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('Config saved successfully:', {
        hasApiKey: !!this.config.apiKey,
        model: this.config.model
      });
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  public getApiKey(): string {
    return this.config.apiKey || '';
  }

  public setApiKey(key: string): void {
    this.config.apiKey = key;
    this.saveConfig();
  }

  public getModel(): string {
    return this.config.model || 'mistralai/Mistral-7B-Instruct-v0.2';
  }

  public setModel(model: string): void {
    this.config.model = model;
    this.saveConfig();
  }
} 