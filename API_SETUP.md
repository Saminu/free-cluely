# AI Wingman - API Setup Guide

This guide will help you set up the Google Gemini API key for AI Wingman.

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Setting Up the API Key

AI Wingman supports multiple ways to configure your API key. Choose the method that works best for your setup:

### Method 1: Environment Variable (Recommended for Development)

Set the environment variable before running the app:

```bash
export GEMINI_API_KEY="your_api_key_here"
npm run electron:dev
```

Or on Windows:
```cmd
set GEMINI_API_KEY=your_api_key_here
npm run electron:dev
```

### Method 2: .env File (Development)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ENABLE_SEARCH_GROUNDING=true
   ```

### Method 3: config.json File (Production)

Create a `config.json` file in the app directory:

```json
{
  "GEMINI_API_KEY": "your_api_key_here",
  "GEMINI_MODEL": "gemini-2.0-flash",
  "ENABLE_SEARCH_GROUNDING": "true"
}
```

### Method 4: User Data Directory (Production)

For production builds, you can create a `config.json` file in the user data directory:

- **macOS**: `~/Library/Application Support/ai-wingman/config.json`
- **Windows**: `%APPDATA%/ai-wingman/config.json`
- **Linux**: `~/.config/ai-wingman/config.json`

Example config.json:
```json
{
  "GEMINI_API_KEY": "your_api_key_here",
  "GEMINI_MODEL": "gemini-2.0-flash",
  "ENABLE_SEARCH_GROUNDING": "true"
}
```

## Configuration Options

### GEMINI_API_KEY (Required)
Your Google Gemini API key from AI Studio.

### GEMINI_MODEL (Optional)
The Gemini model to use. Default: `gemini-2.0-flash`

Available models:
- `gemini-2.0-flash` (recommended)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

### ENABLE_SEARCH_GROUNDING (Optional)
Enable or disable search grounding for real-time information. Default: `true`

Set to `false` or `0` to disable search grounding.

## Building for Production

When building the app for production, make sure to:

1. **Don't include your API key in the build**: The API key should be configured by the end user
2. **Include setup instructions**: Provide clear instructions for users to set up their API key
3. **Test without API key**: Ensure the app shows helpful error messages when the API key is missing

### Building with API Key Included

If you want to include the API key in the production build (not recommended for distribution):

1. Set the environment variable before building:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   npm run app:build
   ```

2. Or create a `config.json` file in the project root before building.

## Troubleshooting

### "GEMINI_API_KEY not found" Error

This error means the app couldn't find your API key. Try these solutions:

1. **Check your API key**: Make sure it's correctly set in one of the configuration methods above
2. **Restart the app**: After setting the API key, restart the application
3. **Check file permissions**: Ensure the config.json file is readable
4. **Verify the key**: Test your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Search Grounding Issues

If search grounding is not working:

1. **Check your API key permissions**: Ensure your API key has access to search features
2. **Disable search grounding**: Set `ENABLE_SEARCH_GROUNDING=false` to use the basic model
3. **Check network connectivity**: Search grounding requires internet access

### Model Not Found Error

If you get a model not found error:

1. **Use a supported model**: Stick to `gemini-2.0-flash` for best compatibility
2. **Check API key permissions**: Ensure your API key has access to the specified model
3. **Update the model name**: Make sure you're using the correct model identifier

## Security Notes

- **Never commit API keys to version control**
- **Use environment variables in production**
- **Rotate API keys regularly**
- **Monitor API usage in Google Cloud Console**

## Support

If you continue to have issues:

1. Check the console logs for detailed error messages
2. Verify your API key at Google AI Studio
3. Ensure you have sufficient API quota
4. Check the [Google AI documentation](https://ai.google.dev/docs) for updates 