import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
5. Identify the DOMAIN. If MULTIPLE unrelated domains are detected (e.g., Banking AND Healthcare), you MUST flag this as a 'Multi-Domain Conflict' and set sessionState to 'QUESTIONING'.
6. STRATEGIC AUDIT: Identify 'Billion Dollar' opportunities—features that create a competitive MOAT, utilize NETWORK EFFECTS, or DISRUPT current industry leaders.

READINESS CHECKLIST (score 1 point ONLY if the USER has provided confirmed, specific details for each):
1. Domain Feasibility — Has the user confirmed the logical possibility of the requirement?
2. Stakeholder Clarity — Has the user explicitly named the target users/roles?
3. Core Process — Has the user described the confirmed "To-Be" workflow?
4. Success Criteria — Has the user provided specific KPIs or acceptance criteria?
5. Scope Boundary — Has the user clearly stated what is IN and OUT of scope?
6. Integration Points — Has the user confirmed specific APIs or external systems?
7. Non-Functional Needs — Has the user confirmed specific compliance, security, or performance targets?

CRITICAL RULE: Do NOT award points for your own questions or for the user simply acknowledging a gap. Points are for DATA, not for DIALOGUE.

You MUST respond with ONLY a valid JSON object. No markdown. No explanation. Just JSON.

Response format:
{
  "sessionState": "QUESTIONING" | "READY",
  "domainDetected": "string — the detected industry/domain",
  "feasibilityIssues": ["array of specific infeasibility problems found, empty if none"],
  "contradictions": ["array of logical contradictions found, empty if none"],
  "regulatoryFlags": ["array of compliance/legal gaps, empty if none"],
  "multiDomainDetected": boolean — true if user is mixing unrelated domains,
  "detectedDomains": ["array of all industries detected"],
  "billionDollarDisruptions": [
    { "title": "string", "impact": "why this is a billion-dollar feature", "effort": "low/med/high" }
  ],
  "strategicMoats": [
    { "type": "Switching Costs" | "Network Effects" | "Cost Advantage" | "Intangible Assets", "observation": "how this requirement builds a moat" }
  ],
  "conflicts": [
    { "id": "string", "description": "description of conflict", "resolution": "proposed resolution strategy", "severity": "HIGH" | "MEDIUM" }
  ],
  "impactScore": {
    "businessValue": number (0-10),
    "technicalFeasibility": number (0-10),
    "strategicAlignment": number (0-10)
  },
  "missingCriticalInfo": ["array of critical missing items"],
  "clarifyingQuestions": ["array of 2-4 targeted questions"],
  "assumptions": ["array of assumptions"],
  "snapshot": [
    { "id": "REQ-1", "text": "Requirement description", "status": "CONFIRMED" | "PROPOSED" }
  ],
  "readinessScore": number (0-10),
  "smeInsight": "string — one professional insight or domain benchmark"
}

RULES:
- sessionState MUST be "QUESTIONING" if (readinessScore < 4 OR if any feasibilityIssues or contradictions exist OR if multiDomainDetected is true) AND round < 3
- sessionState MUST be "READY" if readinessScore >= 4 OR round >= 3
- If round >= 3, you MUST still provide 'clarifyingQuestions' but set sessionState to 'READY' to allow the user to proceed with existing information.
- NEVER make up information — only respond based on what is provided.
- Be SPECIFIC. "Who are the stakeholders?" is bad. "Could you specify whether the primary users are bank tellers, customers, or both?" is good.`;

export async function POST(req: Request) {
  try {
    const { message, round = 0 } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
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
      strategicMoats: analysis.strategicMoats || [],
      impactScore: analysis.impactScore || { businessValue: 0, technicalFeasibility: 0, strategicAlignment: 0 },
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
