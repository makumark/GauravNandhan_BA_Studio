import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText as aiGenerateText, streamText as aiStreamText, GenerateTextParameters, StreamTextParameters } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const groq = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
});

// Primary: Google Gemini (High Intelligence & Syntax Stability for Complex Architectures)
const primaryModel = google(process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash');

// Secondary: Groq Llama 3 (Fallback for speed & quota)
const fallbackModel = groq(process.env.LLM_MODEL_NAME || 'llama-3.1-8b-instant');

export async function robustGenerateText(options: Omit<GenerateTextParameters<any>, 'model' | 'maxRetries'>) {
  try {
    return await aiGenerateText({ ...options, model: primaryModel, maxRetries: 0 });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM Failed:", error.message);
    console.warn("🔄 Automatically switching to Fallback LLM...");
    return await aiGenerateText({ ...options, model: fallbackModel, maxRetries: 0 });
  }
}

export async function robustStreamText(options: Omit<StreamTextParameters<any>, 'model' | 'maxRetries'>) {
  try {
    return await aiStreamText({ ...options, model: primaryModel, maxRetries: 0 });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM Failed:", error.message);
    console.warn("🔄 Automatically switching to Fallback LLM...");
    return await aiStreamText({ ...options, model: fallbackModel, maxRetries: 0 });
  }
}
