"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigHelper = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configuration helper for AI Wingman
class ConfigHelper {
    static instance;
    config = {};
    constructor() {
        this.loadConfiguration();
    }
    static getInstance() {
        if (!ConfigHelper.instance) {
            ConfigHelper.instance = new ConfigHelper();
        }
        return ConfigHelper.instance;
    }
    loadConfiguration() {
        // 1. Try to load from environment variables first
        if (process.env.GEMINI_API_KEY) {
            this.config.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        }
        // 2. Try to load dotenv in development
        try {
            const dotenv = require('dotenv');
            const envPath = path_1.default.join(process.cwd(), '.env');
            if (fs_1.default.existsSync(envPath)) {
                const envConfig = dotenv.config({ path: envPath });
                if (envConfig.parsed) {
                    Object.assign(this.config, envConfig.parsed);
                }
            }
        }
        catch (error) {
            console.log('dotenv not available, continuing with environment variables');
        }
        // 3. Try to load from a config file in the app directory (for production)
        try {
            const configPath = path_1.default.join(process.cwd(), 'config.json');
            if (fs_1.default.existsSync(configPath)) {
                const configFile = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
                Object.assign(this.config, configFile);
            }
        }
        catch (error) {
            console.log('No config.json file found, continuing with existing configuration');
        }
        // 4. Try to load from user data directory (for production)
        try {
            const { app } = require('electron');
            const userDataPath = app.getPath('userData');
            const userConfigPath = path_1.default.join(userDataPath, 'config.json');
            if (fs_1.default.existsSync(userConfigPath)) {
                const userConfig = JSON.parse(fs_1.default.readFileSync(userConfigPath, 'utf8'));
                Object.assign(this.config, userConfig);
            }
        }
        catch (error) {
            console.log('Could not load user config, continuing with existing configuration');
        }
    }
    get(key) {
        return this.config[key];
    }
    getGeminiApiKey() {
        const apiKey = this.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found. Please set it in one of the following ways:\n' +
                '1. Environment variable: GEMINI_API_KEY=your_key\n' +
                '2. Create a .env file with: GEMINI_API_KEY=your_key\n' +
                '3. Create a config.json file with: {"GEMINI_API_KEY": "your_key"}\n' +
                '4. Create a config.json in your user data directory\n' +
                'Get your API key from: https://makersuite.google.com/app/apikey');
        }
        return apiKey;
    }
    getGeminiModel() {
        return this.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    }
    isSearchGroundingEnabled() {
        const enabled = this.get('ENABLE_SEARCH_GROUNDING');
        return enabled !== 'false' && enabled !== '0'; // Default to true unless explicitly disabled
    }
    // Method to save configuration to user data directory
    async saveUserConfig(config) {
        try {
            const { app } = require('electron');
            const userDataPath = app.getPath('userData');
            const userConfigPath = path_1.default.join(userDataPath, 'config.json');
            // Merge with existing config
            let existingConfig = {};
            if (fs_1.default.existsSync(userConfigPath)) {
                existingConfig = JSON.parse(fs_1.default.readFileSync(userConfigPath, 'utf8'));
            }
            const mergedConfig = { ...existingConfig, ...config };
            fs_1.default.writeFileSync(userConfigPath, JSON.stringify(mergedConfig, null, 2));
            // Reload configuration
            this.loadConfiguration();
        }
        catch (error) {
            console.error('Error saving user config:', error);
            throw error;
        }
    }
}
exports.ConfigHelper = ConfigHelper;
//# sourceMappingURL=config.js.map