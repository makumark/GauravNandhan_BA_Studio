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

const AGENT_CONFIGS = {
  'UML Diagrams': {
    name: "System Architect Agent",
    tool: "PlantUML",
    instruction: "Generate professional PlantUML diagrams following UML 2.5 standards. Focus on Architecture, Component, and Sequence diagrams. Use clean, modular syntax. Adhere to C4 modeling principles for complex systems."
  },
  'Flowcharts': {
    name: "Elite Process Architect (Lucidchart Expert)",
    tool: "Mermaid v2",
    instruction: "Generate complex business process flowcharts in Mermaid (graph TD). Emulate Lucidchart's professional aesthetic: clear hierarchy, logical decision nodes, and business-process-model (BPMN) clarity. CRITICAL: Use 'A -->|Label| B' syntax. Focus on end-to-end process integrity."
  },
  'Wireframes': {
    name: "UX Architect Agent",
    tool: "HTML/Tailwind",
    instruction: "Generate a low-fidelity grayscale wireframe in HTML/Tailwind. Use a 'Blueprint' aesthetic. Focus on information architecture, layout, and user journey. Ensure high contrast and clear labeling."
  },
  'Prototypes': {
    name: "Elite UI/UX Designer (Figma Specialist)",
    tool: "HTML/Tailwind/Alpine.js",
    instruction: "Generate a high-fidelity interactive prototype in a single file HTML with Tailwind CSS and Alpine.js. Emulate Figma's high-fidelity aesthetic: precise auto-layout spacing, modern typography (Inter/Roboto), subtle shadows, and smooth interactive transitions. Ensure a premium, state-of-the-art SaaS look and feel."
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
    
    // Use FLASH for speed-critical documents (Prototypes, Wireframes, Flowcharts) to prevent timeouts
    const useFlash = ['Prototypes', 'Wireframes', 'Flowcharts'].includes(documentRequested);
    const modelId = documentRequested ? (useFlash ? 'gemini-2.5-flash' : DOC_MODEL) : CHAT_MODEL;
    
    const model = genAI.getGenerativeModel({ model: modelId, safetySettings });

    // Optimize context: Only include MOM and very recent history to speed up inference
    const momMessage = messages.find((m: any, i: number) => i === 0 || m.role === 'user');
    const recentMessages = messages.slice(-5); // Reduced from 8 to 5 for speed
    const uniqueMessages = Array.from(new Set([momMessage, ...recentMessages])).filter(Boolean);
    const context = uniqueMessages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    if (documentRequested) {
      const prompt = `
        AGENT: ${agent.name}
        SPECIALIZED TOOL: ${agent.tool}
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
            let fullText = "";
            for await (const chunk of result.stream) {
              const text = chunk.text();
              fullText += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
            
            // Post-processing for specific types (optional, but streaming makes this tricky)
            // For now, we stream the raw output for maximum speed.
            controller.close();
          } catch (e: any) {
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
    console.error('API Error:', error);
    const isExpired = error.message.includes('expired') || error.message.includes('key not valid');
    const msg = isExpired ? "CRITICAL: API Key Expired. Please renew in Google AI Studio." : `Agent Error: ${error.message}`;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
