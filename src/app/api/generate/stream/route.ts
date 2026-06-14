import { NextResponse } from 'next/server';
import { robustStreamText } from '@/lib/llm';
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from '@/lib/agents';
import { sanitizeInput, maskCardOutput } from '@/lib/pii';

export const runtime = 'edge';
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      documentRequested,
      domainDetected,
      functionalContext: encodedFunctionalContext,
      existingDocument,
      glossary,
      templateContent
    } = body;

    if (!documentRequested) {
      return NextResponse.json({ error: 'documentRequested is required' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedMessages = (messages || []).map((m: any) => ({
      ...m,
      content: sanitizeInput(m.content)
    }));

    const functionalContext = encodedFunctionalContext
      ? sanitizeInput(encodedFunctionalContext)
      : "";

    const agent = AGENT_CONFIGS[documentRequested as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.DEFAULT;
    const isVisual = documentRequested === 'Prototypes' || documentRequested === 'Wireframes' || documentRequested === 'UML Diagrams' || documentRequested === 'Logic Sandbox';
    const toolExample = GOLD_STANDARD_EXAMPLES[agent.tool as keyof typeof GOLD_STANDARD_EXAMPLES] || "";

    // Full conversation history in order — no deduplication by content
    const uniqueMessages = sanitizedMessages.filter(Boolean);
    const context = (uniqueMessages as any[]).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    // ── FULL CONTEXT INTEGRATION (FIX ARCHITECTURE BOTTLENECK) ──
    let ragContext = "";
    const projectId = body.projectId;
    if (projectId) {
      try {
        const { prisma } = await import('@/lib/prisma');
        // Fetch the latest full scope snapshot instead of truncated graph nodes
        const latestSnapshot = await prisma.scopeSnapshot.findFirst({
          where: { projectId },
          orderBy: { round: "desc" }
        });
        
        if (latestSnapshot && latestSnapshot.snapshot) {
          const reqs = JSON.parse(latestSnapshot.snapshot);
          if (Array.isArray(reqs) && reqs.length > 0) {
            ragContext = reqs.map((r: any) => `[REQUIREMENT] ${r.id || 'REQ'}: ${r.text}`).join("\\n\\n");
          }
        }
        
        if (!ragContext) {
           const recentMessages = await prisma.message.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 30
          });
          
          if (recentMessages.length === 0) {
             return NextResponse.json(
              { error: "Generation Failed\\n\\nError: No requirements extracted yet. Please chat more or wait for background processing.\\n\\nPlease try regenerating." }, 
              { status: 400 }
            );
          }
          const orderedMessages = recentMessages.sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
          ragContext = orderedMessages.map((m: any) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\\n");
        }
      } catch (err) {
        console.warn("Failed to fetch full scope context:", err);
      }
    }

    const prompt = `
AGENT: ${agent.name}
SPECIALIZED TOOL: ${agent.tool}

${toolExample}

TASK: Generate a professional and comprehensive ${documentRequested}.
INSTRUCTIONS: ${agent.instruction}
DOMAIN: ${domainDetected || 'FinTech / Regulatory Technology'}
CURRENT DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${ragContext ? `\nEXTRACTED SYSTEM REQUIREMENTS (KNOWLEDGE BASE):\n"""\n${ragContext}\n"""\nCRITICAL INSTRUCTION: You MUST use these extracted requirements as the foundational source of truth.` : ''}
${existingDocument ? `CURRENT BASELINE (${documentRequested}):\n"""\n${existingDocument}\n"""\nCRITICAL INSTRUCTION: You MUST deeply integrate the new requirements from the CONVERSATION CONTEXT into this baseline. DO NOT just regurgitate the baseline. Modify it to include the new features while preserving the existing structure.` : ''}
${functionalContext ? `SUPPORTING BUSINESS CONTEXT:\n"""\n${functionalContext}\n"""` : ''}
${glossary && glossary.length > 0 ? `ENTITY DICTIONARY (MANDATORY CONSISTENCY):\n"""\n${JSON.stringify(glossary, null, 2)}\n"""\nYou MUST adhere strictly to these terms and rules.` : ''}
${templateContent ? `\nCORPORATE TEMPLATE STRUCTURE (MANDATORY FORMATTING):\n"""\n${templateContent}\n"""\nCRITICAL RULE: You MUST output your response strictly adhering to the exact headers, numbering, and structure provided in the CORPORATE TEMPLATE STRUCTURE above.\n` : ''}
CONVERSATION CONTEXT (INITIAL AND ADDITIONAL REQUIREMENTS):
${context}

CRITICAL RULE: You MUST combine and synthesize ALL requirements provided across the entire conversation history.
CRITICAL RULE: Output ONLY the requested format. Start immediately. No preamble, no "Here is...". NEVER truncate. ALWAYS generate the FULL complete output.
    `.trim();

    const result = await robustStreamText({
      prompt: prompt,
      temperature: 0.0,
      maxTokens: 8000,
    });

    let isClosed = false;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Heartbeat keep-alive
          controller.enqueue(new TextEncoder().encode(" "));
          for await (const chunk of result.textStream) {
            if (isClosed) break;
            let text = chunk;
            if (documentRequested !== 'Prototypes' && documentRequested !== 'Wireframes') {
              text = text
                .replace(/\|?\s*-+->/g, ' --> ')
                .replace(/--\s*>/g, ' --> ')
                .replace(/\|([^\|]+)\|>/g, '|$1|')
                .replace(/\["([^\]]+)"\]/g, (m: string, label: string) => {
                  const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                  return `["${safeLabel}"]`;
                })
                .replace(/\{"([^"]+)"\}/g, (m: string, label: string) => {
                  const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                  return `{"${safeLabel}"}`;
                });
            } else {
              text = maskCardOutput(text);
            }
            controller.enqueue(new TextEncoder().encode(text));
          }

          // ── Hybrid AI: Programmatic Traceability Matrix ──
          if (documentRequested === 'FRD' && projectId) {
             try {
               const { generateTraceabilityMatrix } = await import('@/lib/graph');
               const rtmMarkdown = await generateTraceabilityMatrix(projectId);
               if (rtmMarkdown) {
                 controller.enqueue(new TextEncoder().encode(rtmMarkdown));
               }
             } catch (rtmErr) {
               console.error("Failed to append programmatic RTM:", rtmErr);
             }
          }

        } catch (e: any) {
          if (e.name !== 'AbortError') {
            controller.enqueue(new TextEncoder().encode(`\n\n[Generation Error: ${e.message}]`));
          }
        } finally {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        }
      },
      cancel() { isClosed = true; }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error: any) {
    console.error('Edge Stream Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
