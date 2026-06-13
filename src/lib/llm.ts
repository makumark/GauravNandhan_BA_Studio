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

// Primary: Google Gemini (Flash for speed & quota)
const primaryModel = google(process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash');

// Secondary: Groq Llama 3 (Instant for speed & quota)
const fallbackModel = groq(process.env.LLM_MODEL_NAME || 'llama-3.1-8b-instant');

export async function robustGenerateText(options: Omit<GenerateTextParameters<any>, 'model'>) {
  try {
    return await aiGenerateText({ ...options, model: primaryModel });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM (Google) Failed:", error.message);
    console.warn("🔄 Automatically switching to Fallback LLM (Groq Llama 3)...");
    return await aiGenerateText({ ...options, model: fallbackModel });
  }
}

export async function robustStreamText(options: Omit<StreamTextParameters<any>, 'model'>) {
  try {
    return await aiStreamText({ ...options, model: primaryModel });
  } catch (error: any) {
    console.warn("⚠️ Primary LLM (Google) Failed:", error.message);
    console.warn("🔄 Automatically switching to Fallback LLM (Groq Llama 3)...");
    return await aiStreamText({ ...options, model: fallbackModel });
  }
}
