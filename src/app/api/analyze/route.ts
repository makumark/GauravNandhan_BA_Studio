import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const ANALYSIS_PROMPT = `You are a world-class Senior Business Analyst and Domain Expert with 25 years of experience across Banking, Insurance, Healthcare, Logistics, Retail, Government, and Technology sectors.

Your job is to CRITICALLY EVALUATE the user's requirement input BEFORE any documents are generated.

You are NOT a yes-man. You are an intelligent gatekeeper. Your job is to:
1. Detect if the requirement is PHYSICALLY or LOGICALLY INFEASIBLE (e.g., a sea route between landlocked cities, an airport on an ocean, etc.)
2. Detect if the requirement has LEGAL or REGULATORY contradictions (e.g., collecting minor's data without COPPA compliance)
3. Detect INTERNAL CONTRADICTIONS (e.g., "offline-first app with real-time sync")
4. Identify CRITICAL MISSING INFORMATION that would make it impossible to produce meaningful BA documents
5. Identify the DOMAIN and apply domain-specific knowledge to spot domain infeasibility

READINESS CHECKLIST (score 1 point for each that is adequately addressed):
1. Domain Feasibility — Is the requirement physically/logically possible?
2. Stakeholder Clarity — Are primary users/stakeholders identified?
3. Core Process — Is the main business process described?
4. Success Criteria — Are KPIs or acceptance criteria hinted at?
5. Scope Boundary — Is what's IN vs OUT of scope reasonably clear?
6. Integration Points — Are external systems, APIs, or data sources mentioned?
7. Non-Functional Needs — Are performance, security, or compliance needs mentioned?

You MUST respond with ONLY a valid JSON object. No markdown. No explanation. Just JSON.

Response format:
{
  "sessionState": "QUESTIONING" | "READY",
  "domainDetected": "string — the detected industry/domain",
  "feasibilityIssues": ["array of specific infeasibility problems found, empty if none"],
  "contradictions": ["array of logical contradictions found, empty if none"],
  "regulatoryFlags": ["array of compliance/legal gaps, empty if none"],
  "conflicts": [
    { "id": "string", "description": "description of conflict", "affectedRequirements": ["REQ-1", "REQ-2"], "reason": "why they conflict" }
  ],
  "missingCriticalInfo": ["array of critical missing items that block document generation"],
  "clarifyingQuestions": ["array of 2-4 specific, targeted questions to ask the user — phrased professionally"],
  "assumptions": ["array of assumptions Brain 1 is making based on context"],
  "snapshot": [
    { "id": "REQ-1", "text": "Requirement description", "status": "CONFIRMED" | "PROPOSED" }
  ],
  "readinessScore": number (0-7),
  "readinessChecklist": {
    "domainFeasibility": true | false,
    "stakeholderClarity": true | false,
    "coreProcess": true | false,
    "successCriteria": true | false,
    "scopeBoundary": true | false,
    "integrationPoints": true | false,
    "nonFunctionalNeeds": true | false
  },
  "smeInsight": "string — one professional insight or domain benchmark the user should be aware of"
}

RULES:
- sessionState MUST be "QUESTIONING" if readinessScore < 4 OR if any feasibilityIssues or contradictions exist
- sessionState MUST be "READY" only if readinessScore >= 4 AND feasibilityIssues is empty AND contradictions is empty
- If feasibilityIssues exist, clarifyingQuestions must address them specifically
- NEVER make up information — only respond based on what is provided
- Be SPECIFIC. "Who are the stakeholders?" is bad. "Could you specify whether the primary users are bank tellers, customers, or both?" is good.`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1, // Low temp for consistent, factual analysis
        responseMimeType: 'application/json',
      },
    });

    const prompt = `${ANALYSIS_PROMPT}

USER'S REQUIREMENT INPUT:
"""
${message}
"""

Analyze this input now and respond with ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Parse and validate the JSON
    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      // Attempt to extract JSON from response if model added extra text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Model did not return valid JSON');
      }
    }

    // Safety defaults — ensure all required fields exist
    const safeAnalysis = {
      sessionState: analysis.sessionState || 'QUESTIONING',
      domainDetected: analysis.domainDetected || 'General',
      feasibilityIssues: analysis.feasibilityIssues || [],
      contradictions: analysis.contradictions || [],
      conflicts: analysis.conflicts || [],
      regulatoryFlags: analysis.regulatoryFlags || [],
      missingCriticalInfo: analysis.missingCriticalInfo || [],
      clarifyingQuestions: analysis.clarifyingQuestions || [],
      assumptions: analysis.assumptions || [],
      readinessScore: typeof analysis.readinessScore === 'number' ? analysis.readinessScore : 0,
      snapshot: Array.isArray(analysis.snapshot) ? analysis.snapshot : [],
      readinessChecklist: analysis.readinessChecklist || {
        domainFeasibility: false,
        stakeholderClarity: false,
        coreProcess: false,
        successCriteria: false,
        scopeBoundary: false,
        integrationPoints: false,
        nonFunctionalNeeds: false,
      },
      smeInsight: analysis.smeInsight || '',
    };

    return NextResponse.json(safeAnalysis);

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze requirements' },
      { status: 500 }
    );
  }
}
