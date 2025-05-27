import path from 'path';
import fs from 'fs';

// Configuration helper for AI Wingman
export class ConfigHelper {
  private static instance: ConfigHelper;
  private config: { [key: string]: string } = {};

  private constructor() {
    this.loadConfiguration();
  }

  public static getInstance(): ConfigHelper {
    if (!ConfigHelper.instance) {
      ConfigHelper.instance = new ConfigHelper();
    }
    return ConfigHelper.instance;
  }

  private loadConfiguration() {
    // 1. Try to load from environment variables first
    if (process.env.GEMINI_API_KEY) {
      this.config.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    }

    // 2. Try to load dotenv in development
    try {
      const dotenv = require('dotenv');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envConfig = dotenv.config({ path: envPath });
        if (envConfig.parsed) {
          Object.assign(this.config, envConfig.parsed);
        }
      }
    } catch (error) {
      console.log('dotenv not available, continuing with environment variables');
    }

    // 3. Try to load from a config file in the app directory (for production)
    try {
      const configPath = path.join(process.cwd(), 'config.json');
      if (fs.existsSync(configPath)) {
        const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        Object.assign(this.config, configFile);
      }
    } catch (error) {
      console.log('No config.json file found, continuing with existing configuration');
    }

    // 4. Try to load from user data directory (for production)
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const userConfigPath = path.join(userDataPath, 'config.json');
      if (fs.existsSync(userConfigPath)) {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        Object.assign(this.config, userConfig);
      }
    } catch (error) {
      console.log('Could not load user config, continuing with existing configuration');
    }
  }

  public get(key: string): string | undefined {
    return this.config[key];
  }

  public getGeminiApiKey(): string {
    const apiKey = this.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY not found. Please set it in one of the following ways:\n' +
        '1. Environment variable: GEMINI_API_KEY=your_key\n' +
        '2. Create a .env file with: GEMINI_API_KEY=your_key\n' +
        '3. Create a config.json file with: {"GEMINI_API_KEY": "your_key"}\n' +
        '4. Create a config.json in your user data directory\n' +
        'Get your API key from: https://makersuite.google.com/app/apikey'
      );
    }
    return apiKey;
  }

  public getGeminiModel(): string {
    return this.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  }

  public isSearchGroundingEnabled(): boolean {
    const enabled = this.get('ENABLE_SEARCH_GROUNDING');
    return enabled !== 'false' && enabled !== '0'; // Default to true unless explicitly disabled
  }

  // Method to save configuration to user data directory
  public async saveUserConfig(config: { [key: string]: string }): Promise<void> {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const userConfigPath = path.join(userDataPath, 'config.json');
      
      // Merge with existing config
      let existingConfig = {};
      if (fs.existsSync(userConfigPath)) {
        existingConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
      }
      
      const mergedConfig = { ...existingConfig, ...config };
      fs.writeFileSync(userConfigPath, JSON.stringify(mergedConfig, null, 2));
      
      // Reload configuration
      this.loadConfiguration();
    } catch (error) {
      console.error('Error saving user config:', error);
      throw error;
    }
  }
} 