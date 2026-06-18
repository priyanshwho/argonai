import { google } from '@ai-sdk/google';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined');
}

// Export configured Google Gemini 3.1 Flash-Lite model for fast response times and tool calling
export const googleModel = google('gemini-3.1-flash-lite');
