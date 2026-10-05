const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

let genAI = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

// Ordered list of active, high-speed candidate models supported on Google Generative AI
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-pro-latest',
  'gemini-2.5-pro',
];

/**
 * Generate Structured JSON response from Gemini
 */
const generateStructuredJson = async (systemInstruction, prompt, preferredModel = 'gemini-3.1-flash-lite') => {
  if (!config.geminiApiKey || !genAI) {
    logger.warn('Gemini API key not configured. Using fallback AI generator.');
    return null;
  }

  const modelsToTry = [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();

      // Robust JSON extraction (handles surrounding markdown or extra text)
      let cleaned = textResponse.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      logger.info(`✅ Gemini model "${modelName}" generated structured JSON successfully.`);
      return parsed;
    } catch (error) {
      logger.warn(`Gemini model "${modelName}" error: ${error.message}. Trying next candidate...`);
    }
  }

  logger.warn('All Gemini API models exhausted. Using algorithmic fallback.');
  return null;
};

/**
 * Generate Conversational Text Content (Coach Pulse Chat)
 */
const generateTextContent = async (systemInstruction, prompt, chatHistory = [], preferredModel = 'gemini-3.1-flash-lite') => {
  if (!config.geminiApiKey || !genAI) {
    logger.warn('Gemini API key not configured. Using fallback AI generator.');
    return null;
  }

  const modelsToTry = [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.7,
        },
      });

      const chat = model.startChat({
        history: chatHistory || [],
      });

      const result = await chat.sendMessage(prompt);
      const reply = result.response.text();
      if (reply && reply.trim()) {
        logger.info(`✅ Gemini model "${modelName}" generated Coach Pulse response.`);
        return reply.trim();
      }
    } catch (error) {
      logger.warn(`Gemini text model "${modelName}" error: ${error.message}. Trying next candidate...`);
    }
  }

  return null;
};

module.exports = {
  generateStructuredJson,
  generateTextContent,
};
