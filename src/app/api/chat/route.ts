import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canGenerateDocuments } from '@/lib/permissions';
import { sanitizeInput, maskCardOutput } from '@/lib/pii';
import { rateLimit } from '@/lib/rate-limit';

// ── CRITICAL: Raised to 120s so complex multi-screen prototypes fully complete
export const maxDuration = 120;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const GOLD_STANDARD_EXAMPLES: Record<string, string> = {
  'JSON UI Component': `
### GOLD STANDARD: JSON UI COMPONENT SCHEMA
Example: "Application Dashboard"
\`\`\`json
{
  "screens": [
    {
      "id": "dashboard",
      "title": "Main Dashboard",
      "layout": "sidebar-main",
      "components": [
        { "type": "nav", "links": ["Dashboard", "Settings"] },
        { "type": "card", "title": "Total Revenue", "value": "$50,000", "theme": "primary" },
        { "type": "table", "columns": ["Name", "Status"], "rows": [["Initial Corp", "Approved"]] }
      ]
    }
  ]
}
\`\`\`
`,
  'HTML Template': `
### GOLD STANDARD: HTML TEMPLATE
Example: "Application Dashboard"
\`\`\`html
<div class="min-h-screen bg-slate-900 text-white p-8" x-data="{ open: false }">
  <nav class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <button @click="open = !open" class="px-4 py-2 bg-blue-600 rounded">Menu</button>
  </nav>
  <div x-show="open" class="p-4 bg-slate-800 rounded mb-4">
     <p>Menu is open!</p>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div class="p-6 bg-slate-800 rounded shadow">
      <h2 class="text-xl">Revenue</h2>
      <p class="text-3xl font-bold">$50,000</p>
    </div>
  </div>
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
As the absolute FINAL line of your response (after all other tables and sections), you MUST output a single line in this exact format:
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
    tool: "JSON UI Component",
    instruction: `Generate a CONCISE, low-fidelity grayscale wireframe as a strict JSON UI Schema.
STRICT RULES:
1. Output a SINGLE self-contained JSON object matching the standard.
2. STRUCTURAL SYMMETRY: You MUST generate ALL screens defined in the Functional Requirements.
3. Use the exact same screen names and IDs from the Functional Requirements.
4. TEXTUAL CLARITY: Use actual text labels, field names, and descriptive titles. NEVER use 'Lorem Ipsum'.
5. Set the theme to 'grayscale' in the schema.
6. Output ONLY inside triple-backtick json fences. No explanations outside the code block.`
  },
  'Prototypes': {
    name: "Elite UI/UX Designer",
    tool: "HTML Template",
    instruction: `Generate a CONCISE, high-fidelity SaaS dashboard prototype as a fully functional HTML/Tailwind/Alpine.js workflow.
STRICT RULES:
1. Output a SINGLE self-contained HTML block. Do NOT use html, head, or body tags, just output the content.
2. STRUCTURAL SYMMETRY: You MUST generate functional workflows defined in the Functional Requirements.
3. Set the theme to 'dark-navy-glassmorphism' to ensure deep navy, blue gradients, and glass cards by using appropriate Tailwind classes. Use Alpine.js for interactivity.
4. Include realistic data (investor names, amounts, statuses) in tables or cards.
5. Define functional states and interactive mock data within the HTML template where applicable.
6. PII SECURITY RULE: NEVER output full credit card, debit card, or bank account numbers in the mock data.
7. Output ONLY inside triple-backtick html fences. No explanations.`
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
3. MUST include 'left to right direction' and 'hide empty members' at the top of the diagram to prevent visual overlapping.
4. Maximum 8 classes for layout stability. Max 4 properties/methods per class. Keep the diagram sparse and easy to read.
5. NEVER use the 'artifact' keyword. Use ONLY 'class', 'interface', or 'enum'.
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
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'FRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: `Generate a Functional Requirements Document (FRD) following BABOK v3. RULE: Use strict FR-XXX numbering and provide 100% plain-text Acceptance Criteria.
CRITICAL MANDATORY REQUIREMENT: You MUST include a '## Requirement Traceability Matrix (RTM)' section at the end of the document. You MUST use exactly this Markdown table format:
| Req ID | Description | Business Objective | Priority |
|---|---|---|---|
| FR-001 | ... | ... | ... |
Do not omit this section under any circumstances.
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
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
${DECISION_PARTNER_INSTRUCTION}`
  },
  'SRD': {
    name: "Systems Analyst Agent",
    tool: "Markdown",
    instruction: `Generate a System Requirements Document (SRD). RULE: Focus on ISO/IEC 25010 standards using strictly stable Markdown.
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) in this document. The RTM must only be generated in the FRD.
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
CRITICAL RULE: NEVER include a Requirement Traceability Matrix (RTM) unless explicitly generating an FRD.
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
    const limiter = await rateLimit(userId || userEmail, 10, 60000);
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
      functionalContext: encodedFunctionalContext,
      glossary
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
    const isVisual = documentRequested === 'Prototypes' || documentRequested === 'Wireframes' || documentRequested === 'UML Diagrams';

    const generationConfig: any = {
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
    };

    const model = genAI.getGenerativeModel({
      model: isVisual ? 'gemini-2.5-pro' : 'gemini-2.5-flash', // Revert to pro for visual docs to prevent crashing UI builder
      generationConfig,
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
${glossary && glossary.length > 0 ? `ENTITY DICTIONARY (MANDATORY CONSISTENCY):\n"""\n${JSON.stringify(glossary, null, 2)}\n"""\nYou MUST adhere strictly to these terms and rules.` : ''}
CONVERSATION CONTEXT:
${context}

CRITICAL RULE: Output ONLY the ${agent.tool} content. Start immediately. No preamble, no "Here is...", no markdown outside code fences. NEVER truncate or use placeholders like "... (skipping lines) ...". ALWAYS generate the FULL complete code.
${isVisual ? `MANDATORY SCHEMA: You MUST return a strict JSON object with this exact structure:
{
  "summary": "A brief 1-2 sentence description",
  "code": "The raw string of your code (HTML/React for prototypes, PlantUML for UML, JSON schema for Wireframes). Do NOT wrap in markdown fences inside the JSON string."
}
DO NOT output any markdown blocks outside the JSON.` : ''}
      `.trim();

      let stream: ReadableStream;

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

      if (isVisual) {
        // Stream directly to prevent Vercel 60s timeout for gemini-2.5-pro
        let isClosed = false;
        stream = new ReadableStream({
          async start(controller) {
            try {
              // Write a space immediately to keep the Vercel connection alive
              controller.enqueue(new TextEncoder().encode(" "));
              
              const result = await model.generateContentStream(prompt);
              
              for await (const chunk of result.stream) {
                if (isClosed) break;
                let text = chunk.text();
                // We apply maskCardOutput per chunk. It may miss numbers split across chunk boundaries,
                // but prompt instructions already forbid PII.
                if (documentRequested === 'Prototypes' || documentRequested === 'Wireframes') {
                  text = maskCardOutput(text);
                }
                controller.enqueue(new TextEncoder().encode(text));
              }
            } catch (e: any) {
              if (e.name !== 'AbortError') {
                console.error("Streaming error:", e);
                controller.enqueue(new TextEncoder().encode(`\n\n[Generation Error: ${e.message}]`));
              }
            } finally {
              controller.close();
            }
          },
          cancel() {
            isClosed = true;
          }
        });
      } else {
        // ── Safe Stream with isClosed guard for text documents ───────────────
        let isClosed = false;
        stream = new ReadableStream({
          async start(controller) {
            try {
              // Write a space immediately to keep the Vercel connection alive
              controller.enqueue(new TextEncoder().encode(" "));
              
              const result = await model.generateContentStream(prompt);
              
              for await (const chunk of result.stream) {
                if (isClosed) break;
                const text = chunk.text();
                if (text) {
                  // Nuclear Syntax Hardening (Mermaid)
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
      }

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
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
