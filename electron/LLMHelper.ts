import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel
  private genAI: GoogleGenerativeAI
  private readonly systemPrompt = `You are AI Wingman, an intelligent assistant that sees your screen and hears your conversations to provide contextual help before you even ask. Like Cluely, you're designed to be the "turning point of thought" - helping with meetings, calls, research, coding, writing, and any task you're working on.

Key principles:
- Be proactive and context-aware
- Provide actionable insights and suggestions
- Help with real-time decision making
- Support productivity across all domains (not just coding)
- Be concise but comprehensive
- Anticipate what the user might need next

Analyze the context and provide relevant assistance, suggestions, or answers that would be helpful for the current situation.`

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  }

  private async fileToGenerativePart(imagePath: string) {
    const imageData = await fs.promises.readFile(imagePath)
    return {
      inlineData: {
        data: imageData.toString("base64"),
        mimeType: "image/png"
      }
    }
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nYou are a wingman. Please analyze these images and extract the following information in JSON format:\n{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
  "reasoning": "Explanation of why these suggestions are appropriate."
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      console.error("Error extracting problem from images:", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any) {
    const prompt = `${this.systemPrompt}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nPlease provide your response in the following JSON format:\n{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

    console.log("[LLMHelper] Calling Gemini LLM for solution with search grounding...");
    try {
      // Try to use search grounding for solutions that might benefit from current information
      try {
        const searchModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        });
        
        const result = await searchModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any // Type assertion to bypass TypeScript issues
        });
        
        console.log("[LLMHelper] Gemini LLM returned result with search grounding.");
        const response = await result.response
        const text = this.cleanJsonResponse(response.text())
        const parsed = JSON.parse(text)
        console.log("[LLMHelper] Parsed LLM response:", parsed)
        return parsed
      } catch (searchError) {
        console.log("[LLMHelper] Search grounding failed, falling back to regular model:", searchError);
        // Fall back to regular model without search
        const result = await this.model.generateContent(prompt)
        console.log("[LLMHelper] Gemini LLM returned result.");
        const response = await result.response
        const text = this.cleanJsonResponse(response.text())
        const parsed = JSON.parse(text)
        console.log("[LLMHelper] Parsed LLM response:", parsed)
        return parsed
      }
    } catch (error) {
      console.error("[LLMHelper] Error in generateSolution:", error);
      throw error;
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const imageParts = await Promise.all(debugImagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nYou are a wingman. Given:\n1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}\n2. The current response or approach: ${currentCode}\n3. The debug information in the provided images\n\nPlease analyze the debug information and provide feedback in this JSON format:\n{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images:", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      const audioData = await fs.promises.readFile(audioPath);
      const audioPart = {
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: "audio/mp3"
        }
      };
      const prompt = `${this.systemPrompt}\n\nDescribe this audio clip in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the audio. If the audio content requires current information, recent data, or real-time facts (like current events, latest prices, recent news, etc.), please search for and include the most up-to-date information available. Be natural and conversational, and cite sources when you use current information. Do not return a structured JSON object, just answer naturally as you would to a user.`;
      
      console.log("[LLMHelper] Calling Gemini LLM for audio analysis with search grounding...");
      
      // Try to use search grounding, fall back to regular model if it fails
      try {
        const searchModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        });
        
        const result = await searchModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }, audioPart] }],
          tools: [{ googleSearch: {} }] as any // Type assertion to bypass TypeScript issues
        });
        
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      } catch (searchError) {
        console.log("[LLMHelper] Audio search grounding failed, falling back to regular model:", searchError);
        // Fall back to regular model without search
        const result = await this.model.generateContent([prompt, audioPart]);
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      }
    } catch (error) {
      console.error("Error analyzing audio file:", error);
      throw error;
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      const audioPart = {
        inlineData: {
          data,
          mimeType
        }
      };
      const prompt = `${this.systemPrompt}\n\nDescribe this audio clip in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the audio. If the audio content requires current information, recent data, or real-time facts (like current events, latest prices, recent news, etc.), please search for and include the most up-to-date information available. Be natural and conversational, and cite sources when you use current information. Do not return a structured JSON object, just answer naturally as you would to a user and be concise.`;
      
      console.log("[LLMHelper] Calling Gemini LLM for base64 audio analysis with search grounding...");
      
      // Try to use search grounding, fall back to regular model if it fails
      try {
        const searchModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        });
        
        const result = await searchModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }, audioPart] }],
          tools: [{ googleSearch: {} }] as any // Type assertion to bypass TypeScript issues
        });
        
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      } catch (searchError) {
        console.log("[LLMHelper] Base64 audio search grounding failed, falling back to regular model:", searchError);
        // Fall back to regular model without search
        const result = await this.model.generateContent([prompt, audioPart]);
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      }
    } catch (error) {
      console.error("Error analyzing audio from base64:", error);
      throw error;
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await fs.promises.readFile(imagePath);
      const imagePart = {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: "image/png"
        }
      };
      const prompt = `${this.systemPrompt}\n\nDescribe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. If the image content requires current information, recent data, or real-time facts (like current events, latest prices, recent news, etc.), please search for and include the most up-to-date information available. Be natural and conversational, and cite sources when you use current information. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief.`;
      
      console.log("[LLMHelper] Calling Gemini LLM for image analysis with search grounding...");
      
      // Try to use search grounding, fall back to regular model if it fails
      try {
        const searchModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        });
        
        const result = await searchModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }],
          tools: [{ googleSearch: {} }] as any // Type assertion to bypass TypeScript issues
        });
        
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      } catch (searchError) {
        console.log("[LLMHelper] Image search grounding failed, falling back to regular model:", searchError);
        // Fall back to regular model without search
        const result = await this.model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        return { text, timestamp: Date.now() };
      }
    } catch (error) {
      console.error("Error analyzing image file:", error);
      throw error;
    }
  }

  // Follow-up conversation support with search grounding
  public async askFollowUpQuestion(originalContent: string, followUpQuestion: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []) {
    try {
      // Build conversation context
      let conversationContext = `Original content: ${originalContent}\n\n`;
      
      if (conversationHistory.length > 0) {
        conversationContext += "Previous conversation:\n";
        conversationHistory.forEach((message, index) => {
          conversationContext += `${message.role}: ${message.content}\n`;
        });
        conversationContext += "\n";
      }

      const prompt = `${this.systemPrompt}\n\n${conversationContext}User's follow-up question: ${followUpQuestion}\n\nPlease provide a helpful, concise response that directly addresses their question while maintaining context from our previous conversation. If the question requires current information, recent data, or real-time facts (like current events, latest prices, recent news, etc.), please search for and include the most up-to-date information available. Be natural and conversational, and cite sources when you use current information.`;
      
      console.log("[LLMHelper] Calling Gemini LLM for follow-up with search grounding...");
      
      // Try to use search grounding, fall back to regular model if it fails
      try {
        // Create a model with search tools for this request
        const searchModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash"
        });
        
        const result = await searchModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any // Type assertion to bypass TypeScript issues
        });
        
        const response = await result.response;
        const text = response.text();
        return text;
      } catch (searchError) {
        console.log("[LLMHelper] Search grounding failed, falling back to regular model:", searchError);
        // Fall back to regular model without search
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
      }
    } catch (error) {
      console.error("Error in follow-up question:", error);
      throw error;
    }
  }


} 