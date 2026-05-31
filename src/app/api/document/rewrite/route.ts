import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, instruction } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: 'Text and instruction are required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a Senior BA Assistant.
A user wants you to rewrite a specific section of a document.
INSTRUCTION: ${instruction}
ORIGINAL TEXT:
"""
${text}
"""

CRITICAL RULE: Return ONLY the rewritten text. Do not include markdown code blocks, do not explain your changes, do not write "Here is the rewritten text". Just the raw text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestedText = response.text();

    return NextResponse.json({ suggestedText: suggestedText.trim() });
  } catch (error: any) {
    console.error('Rewrite Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate rewrite' },
      { status: 500 }
    );
  }
}
