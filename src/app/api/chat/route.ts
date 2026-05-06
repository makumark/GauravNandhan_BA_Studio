import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const maxDuration = 60;
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// 2026 VERIFIED STABLE MODELS
const CHAT_MODEL = 'gemini-2.5-flash';
const DOC_MODEL = 'gemini-2.5-pro';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const GOLD_STANDARD_EXAMPLES: Record<string, string> = {
  'HTML/Tailwind/JS (Alpine.js)': `
### GOLD STANDARD: FUNCTIONAL PROTOTYPE (ALPINE.JS)
Example: "KYC Onboarding with Data Persistence"
\`\`\`html
<div x-data="{ screen: 'form', name: '', docStatus: 'Pending', submit() { this.screen = 'success'; this.docStatus = 'Verified'; } }" class="p-8">
  <div x-show="screen === 'form'">
    <h2 class="text-2xl font-bold mb-4">Onboarding</h2>
    <input x-model="name" placeholder="Enter Full Name" class="border p-2 w-full mb-4">
    <button @click="submit()" class="bg-blue-600 text-white px-4 py-2 rounded">Submit KYC</button>
  </div>
  <div x-show="screen === 'success'">
    <h2 class="text-2xl font-bold mb-4 text-green-600">Success!</h2>
    <p>Welcome, <span x-text="name" class="font-bold"></span>.</p>
    <p>Status: <span x-text="docStatus" class="px-2 py-1 bg-green-100 rounded"></span></p>
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
### GOLD STANDARD: UML (PLANTUML)
Example: "Patient Record Management"
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

const AGENT_CONFIGS: Record<string, any> = {
  'UML Diagrams': {
    name: "System Architect Agent",
    tool: "PlantUML",
    instruction: "Generate professional PlantUML. RULE: Output ONLY the code starting with @startuml and ending with @enduml. IMPORTANT: Do NOT use any '!include' statements. Use only standard PlantUML shapes. Ensure the diagram is self-contained and renders perfectly on Kroki.io. Create a clear Sequence or Use Case diagram."
  },
  'Flowcharts': {
    name: "Elite Process Architect",
    tool: "Mermaid v2",
    instruction: "Generate a professional business process flowchart in Mermaid (graph TD). RULE: Use BPMN 2.0 logic. IMPORTANT: Every node label MUST be wrapped in double quotes, e.g., A[\"Start\"]. Every decision node MUST have 'Success' and 'Failure' branches."
  },
  'Wireframes': {
    name: "UX Architect Agent",
    tool: "HTML/Tailwind",
    instruction: "Generate a low-fidelity grayscale wireframe in HTML/Tailwind. Use a 'Blueprint' aesthetic. Focus on information architecture, layout, and user journey. Ensure high contrast and clear labeling."
  },
  'Prototypes': {
    name: "Elite UI/UX Designer (Figma Specialist)",
    tool: "HTML/Tailwind/JS (Alpine.js)",
    instruction: "Generate a high-fidelity, FULLY FUNCTIONAL interactive prototype. MANDATORY RULES:\n1. PRIMARY LANDING: The default screen (e.g. x-data=\"{ screen: 'primary_form' }\") MUST be the most complex, field-rich screen (e.g., 'Create Escrow' or 'Dashboard with Stats'). Do NOT start on a simple welcome screen.\n2. FIELD DENSITY: Every form MUST contain at least 5-7 high-fidelity input fields relevant to the domain (e.g., Currency Pair, Amount, Approval Type, Risk Score).\n3. INSTANT ACCESS: If a login screen exists, it MUST have a 'Bypass Login' button or allow any input to proceed immediately to the main dashboard.\n4. REACTIVE STATE: Use <div x-data=\"{ screen: 'primary_form', user: 'Admin', ... }\">. Every screen must be reachable via @click.\n5. DATA FIDELITY: If the user inputs data, it MUST persist and show on subsequent screens using x-text.\n6. NO DEAD ENDS: Navigation must match the business process logic."
  },
  'Test Cases': {
    name: "QA Engineering Agent",
    tool: "Markdown",
    instruction: "Generate comprehensive test cases following ISTQB standards. Include Test Case ID, Type (Positive/Negative), Description, Pre-conditions, Steps, Expected Results, and Priority. Cover functional, edge-case, and negative scenarios."
  },
  'BRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: "Generate a Business Requirements Document (BRD) following BABOK v3 'Strategy Analysis' and 'Business Analysis Planning & Monitoring' knowledge areas. Focus on Business Need, Stakeholders, and High-level Scope."
  },
  'FRD': {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: "Generate a Functional Requirements Document (FRD) following BABOK v3. Focus on Functional Requirements, Data Requirements, System Interfaces, and CLEAR ACCEPTANCE CRITERIA for each module."
  },
  'Executive Pitch': {
    name: "Venture Architect Agent",
    tool: "Markdown",
    instruction: "Generate a high-impact Executive Pitch and Business Case. Focus on Value Proposition, Market Fit, Competitive Advantage, and ROI. Use professional investor-ready language."
  },
  'PRD': {
    name: "Product Manager Agent",
    tool: "Markdown",
    instruction: "Generate a Product Requirements Document (PRD). Focus on Product Vision, User Stories, Prioritization (MoSCoW), and Success Metrics (KPIs)."
  },
  'SRD': {
    name: "Systems Analyst Agent",
    tool: "Markdown",
    instruction: "Generate a System Requirements Document (SRD). Focus on Non-Functional Requirements (NFRs): Security, Performance, Scalability, and Availability following ISO/IEC 25010 standards."
  },
  DEFAULT: {
    name: "Senior BA Agent",
    tool: "Markdown",
    instruction: "Perform professional BA analysis and requirements elicitation following BABOK v3. RULE: NEVER mention that you can generate documents (BRD, FRD, etc.). The user uses the sidebar tabs for that. Focus purely on the conversation and analysis."
  }
};

export async function POST(req: Request) {
  try {
    const { messages, documentRequested, readinessScore, domainDetected } = await req.json();
    if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const agent = AGENT_CONFIGS[documentRequested as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.DEFAULT;
    
    const modelId = 'gemini-2.5-flash';
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    // Optimize context: 
    // - For documents, we need more history (15 msgs) to capture all user clarifications.
    // - For chat, we need speed (5 msgs).
    const contextSize = documentRequested ? -15 : -5;
    const momMessage = messages.find((m: any, i: number) => i === 0 || m.role === 'user');
    const recentMessages = messages.slice(contextSize);
    const uniqueMessages = Array.from(new Set([momMessage, ...recentMessages])).filter(Boolean);
    const context = uniqueMessages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    if (documentRequested) {
      const toolExample = GOLD_STANDARD_EXAMPLES[agent.tool as keyof typeof GOLD_STANDARD_EXAMPLES] || "";
      const prompt = `
        AGENT: ${agent.name}
        SPECIALIZED TOOL: ${agent.tool}
        
        ${toolExample}

        TASK: Generate a professional and comprehensive ${documentRequested}. ${agent.instruction}
        DOMAIN: ${domainDetected || 'Generic'}
        CONTEXT: ${context}
        RULE: Output ONLY the ${agent.tool} content. No preamble. No conversational filler.
        IMPORTANT: For ${documentRequested}, start immediately with the content. If it is a document, include a clear title header.
      `.trim();

      const result = await model.generateContentStream(prompt);
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              controller.enqueue(new TextEncoder().encode(text));
            }
            controller.close();
          } catch (e: any) {
            console.error('Stream Error:', e);
            controller.error(e);
          }
        },
      });
      return new Response(stream);
    }

    const chatPrompt = `You are the ${agent.name}. Professional BA.
    RULE: NEVER tell the user that you have generated or can generate documents (BRD, FRD, PRD, etc.). 
    The user is aware that documents are generated via the sidebar tabs. 
    Your role in chat is ONLY to analyze requirements, provide SME insights, and resolve conflicts.
    
    IMPORTANT: If Brain 1 detects a 'Multi-Domain Conflict' (e.g. Banking AND Telecom), your TOP PRIORITY is to ask the user to pick ONE primary domain for the current scope. Do NOT proceed with blended analysis.
    
    CONTEXT:
    ${context}`;
    const result = await model.generateContentStream(chatPrompt);
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) { controller.enqueue(new TextEncoder().encode(chunk.text())); }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error('SYSTEM CRASH:', error);
    const errorMsg = error.message || 'Unknown Engine Error';
    return NextResponse.json({ 
      error: `Sovereign Engine Error: ${errorMsg}. Hint: Check API Key or Model availability in your region.` 
    }, { status: 500 });
  }
}
