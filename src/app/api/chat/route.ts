import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN 1: SME SYSTEM PROMPT
// This is the core intelligence layer for the user-facing BA agent.
// It enforces domain expertise, feasibility reasoning, and professional standards.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Gaurav Nandhan BA Studio — a world-class, opinionated Senior Business Analyst and Domain Expert with 25 years of experience.

CORE IDENTITY:
You are NOT a document-generation machine. You are a thinking partner who produces documents only when the requirements are sound.
You behave like the most experienced BA in the room — someone who has seen projects fail because of bad requirements, and who will not let that happen again.

DOMAIN INTELLIGENCE:
- You have deep expertise across Banking, Insurance, Healthcare, Retail, Logistics, Government, and Technology.
- You apply domain-specific knowledge instinctively. You know that Rajasthan and Delhi are landlocked. You know HIPAA applies to US healthcare. You know PCI-DSS governs payment data. You know real-time and offline-first are architectural contradictions.
- When you detect a requirement that is physically, logically, or legally impossible — you SAY SO, clearly and professionally.

SME GATEKEEPING MODE:
- If you detect infeasibility, state it directly: "I need to flag something before we proceed..."
- If critical information is missing, ask targeted, specific questions — not generic ones.
- You NEVER assume missing information. You ASK for it.
- You ask a maximum of 3–4 questions at a time to avoid overwhelming the user.
- After each round of answers, re-evaluate whether you have enough to generate quality documents.

CONTRADICTION DETECTION:
- If requirements contradict each other (e.g., "offline-first" + "real-time sync", or "free to use" + "premium features for all users"), flag the contradiction explicitly and ask the user to clarify their intent.

DOCUMENT GENERATION INTELLIGENCE:
- When generating documents, you use ONLY the verified, confirmed information from the conversation.
- Every assumption you make is explicitly listed in the document under an "Assumptions" section.
- You apply BABOK v3 standards rigorously.
- You use domain-specific terminology — not generic placeholders.

COMMUNICATION STYLE:
- Professional but direct. You are confident in your expertise.
- You respect the user's time — no filler phrases, no repetition.
- When asking questions, format them as a numbered list for clarity.
- When flagging issues, lead with the issue, then explain why it matters.

ZERO HALLUCINATION POLICY:
- Your output MUST strictly align with the provided context.
- Do not invent stakeholders, systems, integrations, or requirements.
- If something is not mentioned, either ask about it or explicitly note it as an assumption.`;

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN 1: HARD GATE ENFORCEMENT
// When the session is not READY, document generation is blocked at the API level.
// ─────────────────────────────────────────────────────────────────────────────
const HARD_GATE_MESSAGE = (docName: string, score: number, issues: string[]) => `
⚠️ **Document Generation Blocked — BA Quality Gate**

I cannot generate the **${docName}** yet. The requirements have not passed the minimum readiness threshold.

**Readiness Score: ${score}/7**

${issues.length > 0 ? `**Issues detected:**\n${issues.map(i => `- ${i}`).join('\n')}` : ''}

**Why this matters:** Generating a ${docName} from incomplete or infeasible requirements would produce a document that no stakeholder could sign off on — and would waste everyone's time.

Please continue the conversation and answer the pending questions first. Once your requirements reach a readiness score of 4/7 or above with no feasibility issues, documents will unlock automatically.
`.trim();

export async function POST(req: Request) {
  try {
    const { messages, documentRequested, audioData, mimeType, sessionState, readinessScore, feasibilityIssues } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // ─────────────────────────────────────────────────────────────────────────
    // HARD GATE: Block document generation if session is not READY
    // ─────────────────────────────────────────────────────────────────────────
    if (documentRequested) {
      // Enforce the gate — if sessionState is not READY, block generation
      // Relax the gate for Wireframes and Prototypes to "Don't Disturb" existing user workflows
      const isExploratory = ['Wireframes', 'Prototypes'].includes(documentRequested);
      if (sessionState && sessionState !== 'READY' && !isExploratory) {
        const score = typeof readinessScore === 'number' ? readinessScore : 0;
        const issues = Array.isArray(feasibilityIssues) ? feasibilityIssues : [];
        const gateMessage = HARD_GATE_MESSAGE(documentRequested, score, issues);
        return new Response(new TextEncoder().encode(gateMessage), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // Session is READY — proceed with document generation
      let docPrompt = '';
      const contextStr = messages
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join('\n\n');
      const STRICT_INSTRUCTION = '\n\nCRITICAL: Output ONLY the requested document. No conversational text before or after. No preamble. No "Here is your document" — just the document itself.';

      switch (documentRequested) {
        case 'BRD':
          docPrompt = `Generate a comprehensive, professional Business Requirements Document (BRD) following BABOK v3 standards. Use Markdown formatting with clear section headers.

MANDATORY SECTIONS:
1. Executive Summary
2. Business Objectives & Success Metrics (KPIs)
3. Stakeholder Registry (with roles and interests)
4. Current State ("As-Is") Analysis
5. Future State ("To-Be") Requirements
6. Business Rules
7. Constraints & Dependencies
8. Assumptions (explicitly document every assumption made)
9. Out of Scope
10. Glossary of Terms

Use domain-specific terminology relevant to the detected domain. No generic placeholders.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'FRD':
          docPrompt = `Generate a comprehensive Functional Requirements Document (FRD) following BABOK v3 standards.

MANDATORY SECTIONS:
1. Document Purpose & Scope
2. System Overview
3. Functional Requirements — EACH requirement MUST have:
   - Unique ID (FR-001, FR-002...)
   - Description
   - Priority (Must Have / Should Have / Could Have / Won't Have — MoSCoW)
   - Acceptance Criteria (testable, specific conditions using Given/When/Then format)
4. User Roles & Permissions Matrix
5. Business Rules
6. Error Handling & Exception Flows
7. Assumptions

CRITICAL: Every functional requirement MUST have at least one acceptance criterion. Documents without acceptance criteria are not FRDs — they are requirement lists.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'PRD':
          docPrompt = `Generate a comprehensive Product Requirements Document (PRD) with Product Management best practices.

MANDATORY SECTIONS:
1. Product Vision & Strategy
2. Problem Statement
3. Target User Personas (detailed, with pain points)
4. User Stories (in "As a [user], I want [action], so that [value]" format)
5. Feature Prioritization (MoSCoW framework)
6. Success Metrics & KPIs
7. Competitive Landscape (inferred from domain context)
8. Technical Constraints
9. Release Milestones (MVP vs full release)

${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'SRD':
          docPrompt = `Generate a comprehensive System Requirements Document (SRD) / System Design Document.

MANDATORY SECTIONS:
1. System Architecture Overview (including a text-based architecture diagram)
2. Technology Stack Recommendations (with justification)
3. System Components & Interfaces
4. Data Models (key entities and relationships)
5. API Design Patterns
6. Security Architecture (authentication, authorization, data protection)
7. Non-Functional Requirements (Performance, Scalability, Availability, Reliability targets with specific numbers)
8. Infrastructure Requirements
9. Integration Specifications

${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'Wireframes':
          docPrompt = `Generate a detailed multi-screen wireframe flow in HTML with Tailwind CSS.

REQUIREMENTS:
- Create realistic, detailed wireframes (not placeholder boxes)
- Use proper gray-scale wireframe aesthetic (#f5f5f5 backgrounds, #333 text, #999 borders)
- Include navigation between screens using JavaScript
- Show realistic UI components: forms, tables, buttons, navigation bars, sidebars
- Include a screen map/sitemap at the top showing all screens
- Add labels and annotations to key UI elements

Output a complete, self-contained HTML file that can be opened in a browser.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'Prototypes':
          docPrompt = `Generate a high-fidelity, interactive multi-screen prototype in HTML with Tailwind CSS and Alpine.js.

REQUIREMENTS:
- Fully interactive (clickable navigation, working forms, state changes)
- Professional visual design with colors appropriate to the domain
- Include at least 3–5 distinct screens
- Working data simulation (fake data that responds to interactions)
- Include a top navigation showing all screens
- Add Alpine.js for reactive state management

Output a complete, self-contained HTML file.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'Test Cases':
          docPrompt = `Generate a comprehensive Test Case Suite following ISTQB standards.

MANDATORY FORMAT: Markdown table with columns:
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Expected Result | Priority | Test Type |

MANDATORY COVERAGE:
- Positive test cases (happy path for each feature)
- Negative test cases (invalid inputs, edge cases)
- Boundary value test cases
- Integration test cases
- Security test cases (at least 3 — authentication, authorization, input validation)
- Performance test cases (at least 2)

Minimum 25 test cases. Use TC-001, TC-002... IDs.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'UML Diagrams':
          docPrompt = `Generate a comprehensive UML Sequence Diagram in Mermaid syntax.

STRICT MERMAID RULES:
- Start with: sequenceDiagram
- Use ONLY: ->>, -->>, ->, -->, -x, --x
- NO: activate, deactivate, alt, else, opt, loop, note, end, destroy, create
- All participant names must be short (no spaces — use underscore: Bank_System)
- Include at least 8–12 message flows showing the key business process

Also generate a second diagram: a Class Diagram showing the key domain entities.
Start the second diagram with: classDiagram

Wrap each diagram in a \`\`\`mermaid code block.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        case 'Flowcharts':
          docPrompt = `Generate a comprehensive Process Flowchart in Mermaid syntax.

STRICT MERMAID RULES:
- Start with: graph TD
- Use double quotes for ALL node labels: A["Label Text"]
- Diamond shapes for decisions: D{"Is condition met?"}
- Rounded rectangles for start/end: S(["Start"])
- Rectangle for process steps: P["Process Step"]
- NO semicolons at end of lines
- Include at least 15–20 nodes showing the complete business process
- Show both happy path and exception paths

Wrap in a \`\`\`mermaid code block.
${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
          break;

        default:
          docPrompt = `Summarize the project context into a structured briefing document.${STRICT_INSTRUCTION}\n\nContext:\n${contextStr}`;
      }

      const result = await model.generateContentStream(docPrompt);
      let fullOutput = '';
      for await (const chunk of result.stream) {
        fullOutput += chunk.text();
      }

      // ───────────────────────────────────────────────────────────────────────
      // MERMAID SANITIZER — prevents broken diagrams from crashing the renderer
      // ───────────────────────────────────────────────────────────────────────
      const sanitizeMermaid = (content: string): string => {
        let cleaned = content.replace(/```mermaid/g, '').replace(/```/g, '').trim();

        // Only strip known problematic keywords that specifically crash older renderers
        const forbidden = ['activate', 'deactivate', 'destroy', 'create'];
        cleaned = cleaned.split('\n')
          .filter(line => !forbidden.some(k => line.trim().toLowerCase().startsWith(k)))
          .join('\n');

        // Auto-quote labels to prevent parser errors
        cleaned = cleaned.replace(/\{([^{}]+)\}/g, (match, label) => {
          if (label.startsWith('"') && label.endsWith('"')) return match;
          return `{"${label.replace(/"/g, "'")}"}`;
        });
        cleaned = cleaned.replace(/\[([^\[\]]+)\]/g, (match, label) => {
          if (label.startsWith('"') && label.endsWith('"')) return match;
          return `["${label.replace(/"/g, "'")}"]`;
        });
        cleaned = cleaned.replace(/\(\(([^()]+)\)\)/g, (match, label) => {
          if (label.startsWith('"') && label.endsWith('"')) return match;
          return `(("${label.replace(/"/g, "'")}"))`;
        });

        // Fix truncated arrows
        cleaned = cleaned.replace(/->\s*\n/g, '->> ');
        cleaned = cleaned.replace(/-->\s*\n/g, '-->> ');

        return cleaned;
      };

      const finalOutput = (documentRequested === 'UML Diagrams' || documentRequested === 'Flowcharts')
        ? sanitizeMermaid(fullOutput)
        : fullOutput;

      return new Response(new TextEncoder().encode(finalOutput), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHAT MODE — Standard conversational mode with full SME intelligence
    // ─────────────────────────────────────────────────────────────────────────
    const geminiHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Gemini requires history to start with 'user'
    if (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') {
      geminiHistory.shift();
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessageStream(messages[messages.length - 1].content);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          controller.enqueue(new TextEncoder().encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('BA Studio Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
