import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { messages, documents, domainDetected } = await req.json();

    const conversationContext = (messages || [])
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const documentSummary = Object.entries(documents || {})
      .map(([name, doc]: [string, any]) => `### ${name}\n${(doc.content || '').substring(0, 800)}...`)
      .join('\n\n---\n\n');

    const prompt = `
You are the HUMAN BRAIN AGENT — a world-class Product Analyst, BA Expert, and Critical Thinking Engine.
You think like a skeptical, senior human expert who has built 100+ enterprise products. You are NOT an AI assistant trying to be polite. You are brutally honest, precise, and relentlessly logical.

Your mission: Perform a DEEP LOOPHOLE AUDIT of the current product session. Identify everything that is WRONG, MISSING, RISKY, or INCONSISTENT — before the user discovers it themselves.

DOMAIN: ${domainDetected || 'General'}

CONVERSATION HISTORY:
${conversationContext || 'No conversation yet.'}

GENERATED DOCUMENTS (truncated previews):
${documentSummary || 'No documents generated yet.'}

Perform a systematic audit across these 7 dimensions and return a structured JSON object. Be SPECIFIC — cite exact quotes from the conversation or documents where relevant.

RETURN ONLY this JSON structure:
{
  "overallHealthScore": <number 0-100>,
  "verdict": "<one of: CRITICAL | AT_RISK | FAIR | STRONG>",
  "loopholes": [
    {
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "category": "<one of: Requirement Gap | Logical Contradiction | Missing Stakeholder | Ambiguity | Scope Creep Risk | Compliance Risk | Technical Infeasibility | Business Model Flaw>",
      "title": "<short title>",
      "description": "<specific loophole — what is missing, wrong, or dangerous>",
      "impact": "<business impact if not addressed>",
      "recommendation": "<concrete action to fix this>"
    }
  ],
  "missingRequirements": ["<specific missing requirement>"],
  "contradictions": ["<specific contradiction found>"],
  "scopeRisks": ["<specific scope creep risk>"],
  "humanBrainInsight": "<2-3 sentences from the perspective of a human expert who has seen projects fail — what would a 20-year veteran say about this project right now?>",
  "nextBestAction": "<the single most important thing the user should do right now>"
}

CRITICAL: Output ONLY valid JSON. No markdown, no preamble. Start with { and end with }.
    `.trim();

    const result = await generateText({
      model: customProvider(process.env.LLM_MODEL_NAME || 'llama-3.3-70b-versatile'),
      prompt: prompt,
      temperature: 0.2,
      maxTokens: 8000,
    });

    const raw = result.text.trim();

    // Extract JSON from the response (in case model wraps it)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        overallHealthScore: 0,
        verdict: 'CRITICAL',
        loopholes: [],
        missingRequirements: [],
        contradictions: [],
        scopeRisks: [],
        humanBrainInsight: 'The Health Agent could not parse the session. This is likely because there is no conversation yet. Start by providing your requirements.',
        nextBestAction: 'Paste your Minutes of Meeting or project requirements in the chat to begin analysis.',
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Health Check Agent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Health check failed' },
      { status: 500 }
    );
  }
}
