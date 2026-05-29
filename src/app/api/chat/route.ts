import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canGenerateDocuments } from '@/lib/permissions';
import { sanitizeInput, maskCardOutput } from '@/lib/pii';
import { rateLimit } from '@/lib/rate-limit';
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from '@/lib/agents';

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
