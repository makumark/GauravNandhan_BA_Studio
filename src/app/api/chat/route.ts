import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canGenerateDocuments } from '@/lib/permissions';
import { sanitizeInput } from '@/lib/pii';
import { rateLimit } from '@/lib/rate-limit';

// ── CRITICAL: Vercel max function duration (Pro plan supports up to 300s)
export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const GOLD_STANDARD_EXAMPLES: Record<string, string> = {
  'HTML/Tailwind/JS (Alpine.js)': `
### GOLD STANDARD: CROSS-SCREEN PERSISTENCE (ALPINE.JS)
Example: "Application Intake & Dashboard"
\`\`\`html
<div x-data="{ 
    activePage: 'form', 
    records: [
      { name: 'Initial Corp', status: 'Approved', amount: '$50,000' }
    ],
    newName: '',
    submit() {
      this.records.push({ name: this.newName, status: 'Pending', amount: '$0' });
      this.newName = '';
      this.activePage = 'dashboard';
    }
  }" class="flex h-64 bg-slate-900 text-white p-4">
  <nav class="w-20 border-r border-white/10 flex flex-col gap-4 text-[10px]">
    <button @click="activePage = 'form'" :class="activePage === 'form' ? 'text-blue-400' : ''">FORM</button>
    <button @click="activePage = 'dashboard'" :class="activePage === 'dashboard' ? 'text-blue-400' : ''">LIST</button>
  </nav>
  <main class="flex-1 p-4">
    <div x-show="activePage === 'form'">
      <input x-model="newName" class="bg-white/5 border border-white/10 p-2 w-full mb-2">
      <button @click="submit()" class="bg-blue-600 px-4 py-2 rounded">Submit Record</button>
    </div>
    <div x-show="activePage === 'dashboard'">
      <template x-for="r in records">
        <div class="flex justify-between border-b border-white/5 py-2">
          <span x-text="r.name"></span>
          <span x-text="r.status" class="text-green-400"></span>
        </div>
      </template>
    </div>
  </main>
</div>
\`\`\`
`,
  'Mermaid': `
### GOLD STANDARD: FLOWCHART (MERMAID)
Example: "Order Fulfillment Logic"
\`\`\`mermaid
graph TD
  A["Customer Order"] --> B{"Stock Check"}
  B -- "In Stock" --> C["Reserve Items"]
  B -- "OOS" --> D["Trigger Restock"]
  C --> E["Payment Processing"]
  E --> F["Ship Order"]
\`\`\`
`,
  'PlantUML': `
### GOLD STANDARD: UML (PLANTUML) - CORRECT SYNTAX
\`\`\`plantuml
@startuml
left to right direction
actor "Doctor" as D
actor "Admin" as A
package "Hospital System" {
  usecase "View Records" as UC1
  usecase "Update Meds" as UC2
}
D --> UC1
D --> UC2
A --> UC1
@enduml
\`\`\`
`
};

// ── Global Decision Partner Rules ──────────────────────────────
const DECISION_PARTNER_INSTRUCTION = `
MANDATORY DECISION PARTNER PROTOCOL:
At the very end of your response, you MUST output a single line in this exact format:
[CONFIDENCE: XX% | REVIEW: REQUIRED/OPTIONAL | LINKS: ID1, ID2 | REASON: Brief explanation]

TRACEABILITY RULE: 
In the LINKS section, you must list the IDs of the parent requirements, business rules, or screens this document fulfills (e.g., REQ-001, FR-05, SCR-02).

CRITERIA FOR CONFIDENCE:
- Below 70%: Major gaps in data. High risk of hallucination. Review required.

PROACTIVE AUDIT RULE:
If the user provides a NEW or MODIFIED requirement, you MUST act as a Decision Partner:
1. Acknowledge the specific change and its business value.
2. Explicitly state: "I have updated the Traceability Matrix to map this new requirement."
3. Explicitly state: "The Cascading Impact Analysis in the Intelligence Panel has flagged [list of documents] for review."
4. Ask: "Should I proceed with regenerating these artifacts to maintain project integrity?"
`;

const AGENT_CONFIGS: Record<string, any> = {
  'Wireframes': {
    name: "UX Architect Agent",
    tool: "HTML/Tailwind",
    instruction: `Generate a CONCISE, low-fidelity grayscale wireframe as an Alpine.js powered HTML snippet.
STRICT RULES:
1. Output a SINGLE self-contained HTML snippet — NOT a full document. Do NOT include <html>, <head>, or <body> tags.
2. STRUCTURAL SYMMETRY: You MUST generate ALL screens defined in the Functional Requirements. The layout and navigation must be identical to the High-Fidelity Prototype.
3. Use the exact same screen names and IDs from the Functional Requirements.
4. TEXTUAL CLARITY: Use actual text labels, field names, and descriptive titles from the requirements. NEVER use empty gray blocks or 'Lorem Ipsum' to represent text.
5. Grayscale Palette: Use bg-white/bg-gray-100 for backgrounds and text-slate-800 for high-contrast text.
6. ALL interactive elements (tabs, buttons) MUST use @click to update the active screen in x-data.
7. Output ONLY inside triple-backtick html fences. No explanations outside the code block.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Prototypes': {
    name: "Elite UI/UX Designer",
    tool: "HTML/Tailwind/JS (Alpine.js)",
    instruction: `Generate a CONCISE, high-fidelity, interactive SaaS dashboard prototype as an Alpine.js powered HTML snippet.
STRICT RULES:
1. Output a SINGLE self-contained HTML snippet — NOT a full document. Do NOT include <html>, <head>, or <body> tags.
2. STRUCTURAL SYMMETRY: You MUST generate ALL screens defined in the Functional Requirements. The layout and navigation must be identical to the Low-Fidelity Wireframe.
3. VISUAL EXCELLENCE: Use deep navy (#0f172a background), blue gradients (from-blue-600 to-cyan-500), glassmorphism cards (bg-white/10 backdrop-blur-md), and white text.
4. EVERY button, tab, and nav link MUST have a functional @click handler.
5. Include realistic data (investor names, amounts, statuses) in tables or cards. No placeholder text like "Lorem Ipsum".
6. CROSS-SCREEN PERSISTENCE & REACTIVE BINDING: Use a single global 'Master State' object in x-data. Fields in subsequent screens must be reactively bound to this object so that data entered on Screen 1 auto-populates Screens 2-6 instantly.
7. EVENT-DRIVEN LOGIC: Implement functional triggers (e.g., clicking 'Approve' must physically move a record from a 'pending' array to a 'completed' array; selecting 'Family Floater' must dynamically toggle the visibility of dependent sections).
8. Output ONLY inside triple-backtick html fences. No explanations outside the code block.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Flowcharts': {
    name: "Elite Process Architect",
    tool: "Mermaid",
    instruction: `Generate professional Flowcharts using strictly stable syntax.
MANDATORY STABILITY RULES:
1. Use ONLY: graph TD
2. Use ONLY solid arrows: -->
3. NEVER use dotted arrows (-.->) or labels on arrows.
4. Put all text INSIDE nodes: A["Action Text"] --> B["Next Step"]
5. Every node MUST have a quoted label: ID["Text"]
6. Maximum 12 nodes for absolute stability.
7. Output ONLY the code block.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'UML Diagrams': {
    name: "System Architect Agent",
    tool: "PlantUML",
    instruction: `Generate a professional, high-fidelity PlantUML Class Diagram. 
MANDATORY STABILITY RULES: 
1. Use ONLY standard class and relationship syntax. 
2. NEVER use parentheses () or spaces in relationship labels. 
3. Use ONLY solid or dashed lines without complex decorators. 
4. Maximum 12 classes for stability.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Test Cases': {
    name: "QA Engineering Agent",
    tool: "Markdown",
    instruction: `Generate comprehensive test cases in Markdown. RULE: Use ONLY standard Markdown tables. NO illegal characters like parentheses or quotes inside cells.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'BRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Generate a Business Requirements Document (BRD) following BABOK v3. RULE: Use strictly numbered sections (1.0, 1.1). NO complex symbols or breaking syntax.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'FRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Generate a Functional Requirements Document (FRD) following BABOK v3. RULE: Use strict FR-XXX numbering and provide 100% plain-text Acceptance Criteria. You MUST include a Requirement Traceability Matrix (RTM) section by default, mapping functional requirements to their business objectives.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Executive Pitch': {
    name: "Venture Architect Agent",
    tool: "Markdown",
    instruction: `Generate a professional Executive Pitch. RULE: Use clean Markdown headers and bullet points only. NO experimental syntax.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'PRD': {
    name: "Product Manager Agent",
    tool: "Markdown",
    instruction: `Generate a Product Requirements Document (PRD). RULE: Use MoSCoW prioritization and standard Markdown lists.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'SRD': {
    name: "Systems Analyst Agent",
    tool: "Markdown",
    instruction: `Generate a System Requirements Document (SRD). RULE: Focus on ISO/IEC 25010 standards using strictly stable Markdown.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'Regulatory Advisor': {
    name: "Sovereign Compliance Agent",
    tool: "Regulatory Audit",
    instruction: `Analyze requirements for regulatory gaps. RULE: Format as a clean, plain-text audit report using only standard Markdown.
${DECISION_PARTNER_INSTRUCTION}`
  },
  DEFAULT: {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Perform professional BA analysis following BABOK v3. RULE: Keep responses structured, professional, and strictly free of breaking syntax characters like stray parentheses in code blocks.
${DECISION_PARTNER_INSTRUCTION}`
  }
};

export async function POST(req: Request) {
  try {
    // ── Role-gate: VIEWER cannot generate documents ──────────────────────────
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const orgId = (session?.user as any)?.organizationId;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    // ── RATE LIMITING: Prevent abuse (10 req/min per user) ───────────────────
    const limiter = rateLimit(userId || userEmail, 10, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${Math.ceil((limiter.reset - Date.now()) / 1000)}s.` },
        { status: 429, headers: { 'X-RateLimit-Reset': limiter.reset.toString() } }
      );
    }

    const {
      messages,
      documentRequested,
      readinessScore,
      domainDetected,
      functionalContext: encodedFunctionalContext
    } = await req.json();

    // Block VIEWER role from generating documents
    if (documentRequested && userRole && !canGenerateDocuments(userRole)) {
      return NextResponse.json(
        { error: 'Your role (Viewer) does not have permission to generate documents. Contact your Admin.' },
        { status: 403 }
      );
    }

    // ── AI SHIELD: Sanitize all inputs before sending to LLM ────────────────
    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      content: sanitizeInput(m.content)
    }));

    const functionalContext = encodedFunctionalContext
      ? sanitizeInput(decodeURIComponent(atob(encodedFunctionalContext)))
      : "";

    const agent = AGENT_CONFIGS[documentRequested as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.DEFAULT;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro', // UPGRADED: High-reasoning model for zero-error output
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
      safetySettings,
    });

    // Build context: include first user message (MOM) + recent messages
    const contextSize = documentRequested ? -15 : -5;
    const momMessage = sanitizedMessages.find((m: any, i: number) => i === 0 || m.role === 'user');
    const recentMessages = sanitizedMessages.slice(contextSize);
    const uniqueMessages = Array.from(new Map(
      [momMessage, ...recentMessages].filter(Boolean).map((m: any) => [m.content, m])
    ).values());
    const context = (uniqueMessages as any[]).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    // ── DOCUMENT GENERATION ──────────────────────────────────────────
    if (documentRequested) {
      const toolExample = GOLD_STANDARD_EXAMPLES[agent.tool as keyof typeof GOLD_STANDARD_EXAMPLES] || "";

      const prompt = `
AGENT: ${agent.name}
SPECIALIZED TOOL: ${agent.tool}

${toolExample}

TASK: Generate a professional and comprehensive ${documentRequested}.
INSTRUCTIONS: ${agent.instruction}
DOMAIN: ${domainDetected || 'FinTech / Regulatory Technology'}
${functionalContext ? `FUNCTIONAL REQUIREMENTS (SOURCE OF TRUTH):\n"""\n${functionalContext}\n"""` : ''}
CONVERSATION CONTEXT:
${context}

CRITICAL RULE: Output ONLY the ${agent.tool} content. Start immediately. No preamble, no "Here is...", no markdown outside code fences.
      `.trim();

      const result = await model.generateContentStream(prompt);

      // ── Audit log: document generation ──────────────────────────────────────
      if (orgId && userId && documentRequested) {
        logAudit({
          organizationId: orgId,
          userId,
          userEmail,
          action: 'DOCUMENT_GENERATED',
          resourceType: documentRequested,
          metadata: { domain: domainDetected || 'General' }
        }).catch(() => {});
      }

      // ── Safe Stream with isClosed guard ──────────────────────────
      let isClosed = false;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              if (isClosed) break;
              const text = chunk.text();
              if (text) {
                // 2. Nuclear Syntax Hardening
                let cleanText = text
                  .replace(/\|?\s*-+\s*->/g, ' --> ') // Fix malformed arrows like | -- ->
                  .replace(/--\s*>/g, ' --> ')        // Fix space in arrows
                  .replace(/\["([^\]]+)"\]/g, (m, label) => {
                    // Strip characters that break Mermaid labels even inside quotes
                    const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                    return `["${safeLabel}"]`;
                  })
                  .replace(/\{"([^"]+)"\}/g, (m, label) => {
                    const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                    return `{"${safeLabel}"}`;
                  });
                controller.enqueue(new TextEncoder().encode(cleanText));
              }
            }
          } catch (e: any) {
            console.error('Document Stream Error:', e);
            if (!isClosed) {
              isClosed = true;
              controller.error(e);
            }
          } finally {
            if (!isClosed) {
              isClosed = true;
              controller.close();
            }
          }
        },
        cancel() {
          isClosed = true;
        },
      });

      return new Response(stream);
    }

    // ── CHAT (Brain 1 Intake) ────────────────────────────────────────
    const chatPrompt = `You are the ${agent.name}. You are a professional Business Analyst powered by the BABOK v3 framework.
RULES:
- NEVER tell the user you have generated or can generate documents (BRD, FRD, PRD, etc.). The sidebar handles that.
- Your role is to analyze requirements, surface SME insights, identify gaps, and ask clarifying questions.
- If you detect a multi-domain conflict (e.g., Banking AND Telecom in the same scope), ask the user to pick ONE domain before proceeding.

CONVERSATION CONTEXT:
${context}`;

    const result = await model.generateContentStream(chatPrompt);

    let isClosed = false;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            if (isClosed) break;
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (e: any) {
          console.error('Chat Stream Error:', e);
          if (!isClosed) {
            isClosed = true;
            controller.error(e);
          }
        } finally {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        }
      },
      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error('SYSTEM CRASH:', error);
    const errorMsg = error.message || 'Unknown Engine Error';
    return NextResponse.json(
      { error: `Engine Error: ${errorMsg}. Check API Key or model availability.` },
      { status: 500 }
    );
  }
}
