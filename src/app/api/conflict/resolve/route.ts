// ── Conflict Resolution API ──────────────────────────────────────────────────
// POST /api/conflict/resolve
// Accepts: { statementA, statementB, sourceA, sourceB, choice, projectId, docType }
// Classifies: ADDITIVE (both coexist, AI merges) vs CONTRADICTORY (user must pick one)
// Returns: { type, mergedText, deprecated, updateFRD }

import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { sanitizeInput } from '@/lib/pii';

export const maxDuration = 60;

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { statementA, statementB, sourceA, sourceB, choice } = body;

    if (!statementA || !statementB) {
      return NextResponse.json({ error: 'Both statements are required' }, { status: 400 });
    }

    const sA = sanitizeInput(statementA);
    const sB = sanitizeInput(statementB);

    // ── Step 1: Classify conflict type (ADDITIVE vs CONTRADICTORY) ──────────
    const classifyPrompt = `You are a senior Business Analyst expert.

Two requirements exist in the same project at different points in time:

STATEMENT A (${sourceA || 'Earlier version'}):
"${sA}"

STATEMENT B (${sourceB || 'Later version'}):
"${sB}"

Classify this conflict:
- ADDITIVE: Both can coexist. Statement B extends or layers on top of Statement A without negating it. 
  Example: A=password login, B=MFA — both can coexist as a phased login system.
- CONTRADICTORY: They are mutually exclusive. Implementing both is logically impossible.
  Example: A=collect user location, B=never collect user location.

Also, if ADDITIVE and the user chose "merge", write ONE unified requirement that:
1. Preserves what Statement A already built (important: it may already be developed)
2. Appends Statement B as an additional layer or Phase 2 enhancement
3. Is clear, atomic, and written in standard format: "The system shall..."

If CONTRADICTORY, do NOT write a merge — just classify.

Respond with ONLY valid JSON:
{
  "conflictType": "ADDITIVE" | "CONTRADICTORY",
  "reasoning": "1-2 sentence explanation of why",
  "mergedRequirement": "The merged requirement text (only if ADDITIVE)",
  "phaseNote": "Optional note like 'Phase 1: Statement A. Phase 2 (this sprint): Statement B.'"
}`;

    const { robustGenerateText } = require('@/lib/llm');
    const result = await robustGenerateText({
      prompt: classifyPrompt,
      temperature: 0.1,
      maxTokens: 4000,
    });
    const rawText = result.text.trim();

    let classification: any;
    try {
      classification = JSON.parse(rawText);
    } catch {
      classification = { conflictType: 'ADDITIVE', reasoning: 'Unable to classify.', mergedRequirement: `${sA} Additionally, ${sB}` };
    }

    // ── Step 2: Build the resolution response ────────────────────────────────
    const conflictType: 'ADDITIVE' | 'CONTRADICTORY' = classification.conflictType === 'CONTRADICTORY' ? 'CONTRADICTORY' : 'ADDITIVE';

    let finalText = '';
    let deprecatedText = '';
    let canMerge = true;

    if (conflictType === 'CONTRADICTORY') {
      canMerge = false;
      if (choice === 'A') {
        finalText = sA;
        deprecatedText = `[DEPRECATED — Superseded by Sprint decision] ${sB}`;
      } else if (choice === 'B') {
        finalText = sB;
        deprecatedText = `[DEPRECATED — Superseded by Sprint decision] ${sA}`;
      }
      // If choice === 'merge' with contradictory, force pick A (should not happen in UI)
      if (!choice || choice === 'merge') {
        finalText = sA;
        deprecatedText = `[DEPRECATED] ${sB}`;
      }
    } else {
      // ADDITIVE — AI merges
      canMerge = true;
      if (choice === 'merge') {
        finalText = classification.mergedRequirement || `${sA} Additionally, ${sB}`;
      } else if (choice === 'A') {
        finalText = sA;
        deprecatedText = `[DEFERRED to Phase 2] ${sB}`;
      } else if (choice === 'B') {
        finalText = sB;
        deprecatedText = `[Replaced by updated requirement] ${sA}`;
      }
    }

    return NextResponse.json({
      conflictType,
      canMerge,
      reasoning: classification.reasoning,
      phaseNote: classification.phaseNote || null,
      mergedRequirement: finalText,
      deprecatedStatement: deprecatedText,
    });

  } catch (error: any) {
    console.error('Conflict resolve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
