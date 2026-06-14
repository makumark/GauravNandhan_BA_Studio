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

let lastPrimarySuccessTime = 0;
const PRIMARY_HEALTH_TTL = 30000; // 30 seconds

export async function robustGenerateText(options: Omit<GenerateTextParameters<any>, 'model' | 'maxRetries'>) {
  try {
    const result = await aiGenerateText({ ...options, model: primaryModel, maxRetries: 0 });
    lastPrimarySuccessTime = Date.now();
    return result;
  } catch (error: any) {
    console.warn("⚠️ Primary LLM (Gemini) Failed:", error.message);
    lastPrimarySuccessTime = 0; // invalidate cache
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
  const now = Date.now();
  let activeModel = primaryModel;
  let skippedPreflight = false;

  if (now - lastPrimarySuccessTime < PRIMARY_HEALTH_TTL) {
    skippedPreflight = true;
  } else {
    try {
      // Pre-flight probe to verify if primary model is available and has quota
      await aiGenerateText({
        model: primaryModel,
        prompt: "ping",
        maxTokens: 1,
        maxRetries: 0,
      });
      lastPrimarySuccessTime = Date.now();
    } catch (error: any) {
      console.warn("⚠️ Primary LLM (Gemini) pre-flight check failed:", error.message);
      lastPrimarySuccessTime = 0;
      try {
        console.warn("🔄 Switching to Fallback LLM (Groq) for streaming...");
        await aiGenerateText({
          model: fallbackModel,
          prompt: "ping",
          maxTokens: 1,
          maxRetries: 0,
        });
        activeModel = fallbackModel;
      } catch (err2: any) {
        console.warn("⚠️ Fallback LLM (Groq) pre-flight check failed:", err2.message);
        if (process.env.OPENROUTER_API_KEY) {
          try {
            console.warn("🔄 Switching to Tertiary LLM (OpenRouter) for streaming...");
            await aiGenerateText({
              model: tertiaryModel,
              prompt: "ping",
              maxTokens: 1,
              maxRetries: 0,
            });
            activeModel = tertiaryModel;
          } catch (err3: any) {
            throw new Error(`All LLM Providers (Gemini, Groq, OpenRouter) exhausted. Last error: ${err3.message}`);
          }
        } else {
          throw new Error(`Primary (Gemini) and Secondary (Groq) LLM Providers exhausted. Last error: ${err2.message}. Please configure OPENROUTER_API_KEY or upgrade to paid tiers to prevent disruption.`);
        }
      }
    }
  }

  try {
    const result = await aiStreamText({ ...options, model: activeModel, maxRetries: 0 });
    if (activeModel === primaryModel) {
      lastPrimarySuccessTime = Date.now();
    }
    return result;
  } catch (streamError: any) {
    if (skippedPreflight && activeModel === primaryModel) {
      // If we skipped preflight and it failed, invalidate cache and retry with fallback
      console.warn("⚠️ Primary stream failed post-cache. Retrying with fallbacks...", streamError.message);
      lastPrimarySuccessTime = 0;
      return await robustStreamText(options);
    }
    throw streamError;
  }
}

