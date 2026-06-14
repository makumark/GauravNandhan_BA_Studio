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

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

const primaryModel = google(process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash');
const fallbackModel = groq(process.env.LLM_MODEL_NAME || 'llama-3.3-70b-versatile');
const tertiaryModel = openrouter(process.env.TERTIARY_MODEL_NAME || 'meta-llama/llama-3.3-70b-instruct');

export async function robustGenerateText(options: Omit<GenerateTextParameters<any>, 'model' | 'maxRetries'>) {
  try {
    return await aiGenerateText({ ...options, model: primaryModel, maxRetries: 0 });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM (Gemini) Failed:", error.message);
    try {
      console.warn("🔄 Automatically switching to Fallback LLM (Groq)...");
      return await aiGenerateText({ ...options, model: fallbackModel, maxRetries: 0 });
    } catch (err2: any) {
      console.warn("⚠️ Fallback LLM (Groq) Failed:", err2.message);
      if (process.env.OPENROUTER_API_KEY) {
        try {
          console.warn("🔄 Automatically switching to Tertiary LLM (OpenRouter)...");
          return await aiGenerateText({ ...options, model: tertiaryModel, maxRetries: 0 });
        } catch (err3: any) {
          throw new Error(`All LLM Providers (Gemini, Groq, OpenRouter) exhausted. Last error: ${err3.message}`);
        }
      }
      throw new Error(`Primary (Gemini) and Secondary (Groq) LLM Providers exhausted. Last error: ${err2.message}. Please configure OPENROUTER_API_KEY or upgrade to paid tiers to prevent disruption.`);
    }
  }
}

export async function robustStreamText(options: Omit<StreamTextParameters<any>, 'model' | 'maxRetries'>) {
  try {
    return await aiStreamText({ ...options, model: primaryModel, maxRetries: 0 });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM (Gemini) Failed:", error.message);
    try {
      console.warn("🔄 Automatically switching to Fallback LLM (Groq)...");
      return await aiStreamText({ ...options, model: fallbackModel, maxRetries: 0 });
    } catch (err2: any) {
      console.warn("⚠️ Fallback LLM (Groq) Failed:", err2.message);
      if (process.env.OPENROUTER_API_KEY) {
        try {
          console.warn("🔄 Automatically switching to Tertiary LLM (OpenRouter)...");
          return await aiStreamText({ ...options, model: tertiaryModel, maxRetries: 0 });
        } catch (err3: any) {
          throw new Error(`All LLM Providers (Gemini, Groq, OpenRouter) exhausted. Last error: ${err3.message}`);
        }
      }
      throw new Error(`Primary (Gemini) and Secondary (Groq) LLM Providers exhausted. Last error: ${err2.message}. Please configure OPENROUTER_API_KEY or upgrade to paid tiers to prevent disruption.`);
    }
  }
}

