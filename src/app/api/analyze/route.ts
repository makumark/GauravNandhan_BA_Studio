import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canGenerateDocuments } from '@/lib/permissions';
import { sanitizeInput } from '@/lib/pii';
import { rateLimit } from '@/lib/rate-limit';
import { inferEdgesFromSnapshot, upsertGraph, type GraphNodeData, type GraphEdgeData } from '@/lib/graph';
import { prisma } from '@/lib/prisma';

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
  "requirementGaps": [
    { "area": "Security|Compliance|UX|Data", "gap": "description of what is missing", "severity": "HIGH|MEDIUM" }
  ],
  "logicAlerts": [
    { "type": "Infinite Loop|Dead End|Missing Branch", "description": "logic flaw found", "risk": "technical/business risk" }
  ],
  "clarifyingQuestions": ["array of 2-4 targeted questions"],
  "assumptions": ["array of assumptions"],
  "snapshot": [
    { "id": "REQ-1", "text": "Requirement description", "status": "CONFIRMED" | "PROPOSED" }
  ],
  "readinessScore": number (0-10),
  "readinessChecklist": {
    "domainFeasibility": boolean,
    "stakeholderClarity": boolean,
    "coreProcess": boolean,
    "successCriteria": boolean,
    "scopeBoundary": boolean,
    "integrationPoints": boolean,
    "nonFunctionalNeeds": boolean
  },
  "smeInsight": "string — one professional insight or domain benchmark",
  "graphNodes": [
    {
      "nodeId": "string — unique ID matching snapshot IDs (e.g. REQ-1, SCR-01, API-01, TC-01)",
      "nodeType": "REQUIREMENT" | "SCREEN" | "API" | "TEST_CASE" | "EPIC" | "FEATURE",
      "label": "string — short human-readable name of this artifact"
    }
  ],
  "graphEdges": [
    {
      "from": "string — source nodeId",
      "to": "string — target nodeId",
      "relationship": "CONTAINS" | "RENDERS_ON" | "CALLS" | "VERIFIED_BY" | "DOCUMENTED_IN"
    }
  ],
  "glossary": [
    { "term": "string", "definition": "string", "type": "ENTITY|RULE|FIELD" }
  ]
}

RULES:
- sessionState MUST be "QUESTIONING" if (readinessScore < 4 OR if any feasibilityIssues or contradictions exist OR if multiDomainDetected is true) AND round < 3
- sessionState MUST be "READY" if readinessScore >= 4 OR round >= 3
- If round >= 3, you MUST still provide 'clarifyingQuestions' but set sessionState to 'READY' to allow the user to proceed with existing information.
- NEVER make up information — only respond based on what is provided.
- Be SPECIFIC. "Who are the stakeholders?" is bad. "Could you specify whether the primary users are bank tellers, customers, or both?" is good.
- TIMEOUT PREVENTION: To prevent 60-second timeouts, you MUST limit graphNodes to a MAXIMUM of 15 critical core artifacts, and graphEdges to a MAXIMUM of 20 critical links. Do NOT generate massive graphs.
- For graphNodes: extract only the top distinct artifacts (Requirements, UI Screens, APIs).
- For graphEdges: map which requirements drive which screens (RENDERS_ON), and APIs (CALLS).`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    const limiter = await rateLimit(userId || userEmail, 10, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${Math.ceil((limiter.reset - Date.now()) / 1000)}s.` },
        { status: 429, headers: { 'X-RateLimit-Reset': limiter.reset.toString() } }
      );
    }

    if (userRole && !canGenerateDocuments(userRole)) {
      return NextResponse.json(
        { error: 'Your role (Viewer) does not have permission to analyze requirements. Contact your Admin.' },
        { status: 403 }
      );
    }

    const { message: rawMessage, history = [], round = 0, projectId } = await req.json();
    const message = sanitizeInput(rawMessage);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
    }

    if ((!message || !message.trim()) && history.length === 0) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // ── Build Context-Aware Prompt ──────────────────────────────
    const uniqueMessages = history.filter(Boolean);
    const context = (uniqueMessages as any[]).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const prompt = `${ANALYSIS_PROMPT}

PROJECT HISTORY (Context of previous meetings):
"""
${context}
"""

CURRENT REQUIREMENT INPUT (Meeting Update):
"""
${message}
"""

Analyze the evolution of these requirements. In the "snapshot" field, return the CUMULATIVE list of all confirmed requirements so far.
Analyze this input now and respond with ONLY the JSON object.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash', // STABLE: Current production model as of May 2026
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Parse and validate the JSON
    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      // Attempt to extract JSON from response if model added extra text
      const jsonMatch = rawText.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          analysis = null;
        }
      }
      
      if (!analysis) {
        console.warn('Model did not return valid JSON. Falling back to default.');
        analysis = {
          sessionState: "QUESTIONING",
          domainDetected: "Complex Domain (Parsing Incomplete)",
          smeInsight: "The requirement volume was too large to fully parse in one pass.",
          feasibilityIssues: ["Requirement volume exceeds single-pass analysis limits."],
          clarifyingQuestions: ["Can we break this down into smaller chunks?"]
        };
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
      requirementGaps: analysis.requirementGaps || [],
      logicAlerts: analysis.logicAlerts || [],
      billionDollarDisruptions: analysis.billionDollarDisruptions || [],
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
      // ── Semantic Graph fields (new — always safe arrays) ────────────────────────────
      graphNodes: Array.isArray(analysis.graphNodes) ? analysis.graphNodes as GraphNodeData[] : [],
      graphEdges: Array.isArray(analysis.graphEdges) ? analysis.graphEdges as GraphEdgeData[] : [],
      glossary: Array.isArray(analysis.glossary) ? analysis.glossary : [],
    };

    // ── Semantic Graph: fill missing edges via heuristic inference ──────────────────
    // If the AI returned nodes but no edges (or sparse edges), infer them.
    if (safeAnalysis.graphNodes.length > 0 && safeAnalysis.graphEdges.length === 0) {
      safeAnalysis.graphEdges = inferEdgesFromSnapshot(safeAnalysis.graphNodes);
    }

    // Also synthesise document nodes from the snapshot requirements
    if (safeAnalysis.snapshot.length > 0 && safeAnalysis.graphNodes.length === 0) {
      // Fallback: build basic REQUIREMENT nodes from the existing snapshot
      safeAnalysis.graphNodes = safeAnalysis.snapshot.map((req: any) => ({
        nodeId:   req.id,
        nodeType: 'REQUIREMENT' as const,
        label:    req.text.substring(0, 60),
      }));
      safeAnalysis.graphEdges = inferEdgesFromSnapshot(safeAnalysis.graphNodes);
    }

    // ── Server-side DB persistence: fire-and-forget, never blocks response ────────
    if (projectId && safeAnalysis.graphNodes.length > 0) {
      upsertGraph(projectId, safeAnalysis.graphNodes, safeAnalysis.graphEdges).catch(() => {});
    }

    // ── Scope Snapshot: persist requirement count for cross-session creep tracking ──
    if (projectId && safeAnalysis.snapshot.length > 0) {
      prisma.scopeSnapshot.create({
        data: {
          projectId,
          round,
          reqCount: safeAnalysis.snapshot.length,
          snapshot: JSON.stringify(safeAnalysis.snapshot),
        }
      }).catch(() => {}); // fire-and-forget — never blocks the response
    }

    return NextResponse.json(safeAnalysis);

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze requirements' },
      { status: 500 }
    );
  }
}
