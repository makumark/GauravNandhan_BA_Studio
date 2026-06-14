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

// Primary: Groq Llama 3.3 70B (High Intelligence & Architecture match for Google API)
const primaryModel = groq(process.env.LLM_MODEL_NAME || 'llama-3.3-70b-versatile');

// Secondary: Google Gemini (Disabled by default due to region lock)
const fallbackModel = google(process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash');

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
