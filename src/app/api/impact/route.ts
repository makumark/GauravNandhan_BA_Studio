import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || 'custom-key',
});

const IMPACT_PROMPT = `You are a Senior Project Manager and Systems Architect. Your job is to perform a detailed IMPACT ANALYSIS between two versions of business requirements.

You will be given:
1. PREVIOUS SNAPSHOT: A list of requirements we already agreed on.
2. CURRENT SNAPSHOT: The updated list of requirements after the user's latest input.

Your goal is to detect:
- ADDITIONS: New scope that wasn't there before.
- MODIFICATIONS: Existing requirements that have changed.
- DELETIONS: Scope that has been removed or is now obsolete.
- CASCADING IMPACT: This is the most important. If Requirement A changes, what other requirements are logically affected?

You MUST respond with ONLY a valid JSON object.

Response format:
{
  "summary": "string — a 1-sentence summary of the main change",
  "changes": [
    { "id": "REQ-ID", "type": "ADDED" | "MODIFIED" | "REMOVED", "text": "description", "impact": "description of downstream effects" }
  ],
  "scopeCreepAlert": boolean — true if the new scope significantly expands the project timeline or complexity,
  "complexityIncrease": "LOW" | "MEDIUM" | "HIGH",
  "architecturalConflict": "string — any technical conflict detected, empty if none"
}

RULES:
- Be precise. If the user switched from "Login" to "Social Login," the impact is that "User Database" needs to change to "OAuth Integration."
- Use professional, project-manager tone.
- If there are no changes, return an empty 'changes' array.`;

export async function POST(req: Request) {
  try {
    const { previousSnapshot, currentSnapshot } = await req.json();

    // Model setup handled in generateText

    const prompt = `${IMPACT_PROMPT}

PREVIOUS SNAPSHOT:
${JSON.stringify(previousSnapshot, null, 2)}

CURRENT SNAPSHOT:
${JSON.stringify(currentSnapshot, null, 2)}

Analyze the delta and cascading impact now. Response ONLY JSON.`;

    const result = await generateText({
      model: customProvider(process.env.LLM_MODEL_NAME || 'llama-3.3-70b-versatile'),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 8000,
    });
    const rawText = result.text.trim();

    let impact;
    try {
      impact = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      impact = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'No changes detected', changes: [] };
    }

    return NextResponse.json(impact);

  } catch (error: any) {
    console.error('Impact Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform impact analysis' },
      { status: 500 }
    );
  }
}
