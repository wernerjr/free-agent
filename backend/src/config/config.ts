import fs from 'fs';
import path from 'path';
import { Config } from '../types';
import { SERVER_CONFIG } from './server';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private apiKey: string = '';
  private model: string = 'mistralai/Mistral-7B-Instruct-v0.2';

  private constructor() {
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
      if (fs.existsSync(SERVER_CONFIG.dataPath.config)) {
        const data = fs.readFileSync(SERVER_CONFIG.dataPath.config, 'utf8');
        const loadedConfig = JSON.parse(data);
        this.config = {
          apiKey: loadedConfig.apiKey,
          model: loadedConfig.model || this.model
        };
        if (this.config.apiKey) {
          this.apiKey = this.config.apiKey;
        }
        if (this.config.model) {
          this.model = this.config.model;
        }
        return this.config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    this.config = { model: this.model };
    return this.config;
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(SERVER_CONFIG.dataPath.config);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(SERVER_CONFIG.dataPath.config, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
    this.config.apiKey = key;
    this.saveConfig();
  }

  public getModel(): string {
    return this.model;
  }

  public setModel(model: string): void {
    this.model = model;
    this.config.model = model;
    this.saveConfig();
  }
} 