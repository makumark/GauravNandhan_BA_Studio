import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '',
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, instruction } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: 'Text and instruction are required' }, { status: 400 });
    }

    const prompt = `You are a Senior BA Assistant.
A user wants you to rewrite a specific section of a document.
INSTRUCTION: ${instruction}
ORIGINAL TEXT:
"""
${text}
"""

CRITICAL RULE: Return ONLY the rewritten text. Do not include markdown code blocks, do not explain your changes, do not write "Here is the rewritten text". Just the raw text.`;

    const result = await generateText({
      model: customProvider(process.env.LLM_MODEL_NAME || 'llama-3.3-70b-versatile'),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 4000,
    });
    const suggestedText = result.text;

    return NextResponse.json({ suggestedText: suggestedText.trim() });
  } catch (error: any) {
    console.error('Rewrite Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate rewrite' },
      { status: 500 }
    );
  }
}
