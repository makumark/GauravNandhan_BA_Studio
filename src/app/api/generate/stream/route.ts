import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from '@/lib/agents';
import { sanitizeInput, maskCardOutput } from '@/lib/pii';


export const runtime = 'edge';
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
    const body = await req.json();
    const {
      messages,
      documentRequested,
      domainDetected,
      functionalContext: encodedFunctionalContext,
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

    const prompt = `
AGENT: ${agent.name}
SPECIALIZED TOOL: ${agent.tool}

${toolExample}

TASK: Generate a professional and comprehensive ${documentRequested}.
INSTRUCTIONS: ${agent.instruction}
DOMAIN: ${domainDetected || 'FinTech / Regulatory Technology'}
${functionalContext ? `FUNCTIONAL REQUIREMENTS (SOURCE OF TRUTH):\n"""\n${functionalContext}\n"""` : ''}
${glossary && glossary.length > 0 ? `ENTITY DICTIONARY (MANDATORY CONSISTENCY):\n"""\n${JSON.stringify(glossary, null, 2)}\n"""\nYou MUST adhere strictly to these terms and rules.` : ''}
${templateContent ? `\nCORPORATE TEMPLATE STRUCTURE (MANDATORY FORMATTING):\n"""\n${templateContent}\n"""\nCRITICAL RULE: You MUST output your response strictly adhering to the exact headers, numbering, and structure provided in the CORPORATE TEMPLATE STRUCTURE above.\n` : ''}
CONVERSATION CONTEXT (INITIAL AND ADDITIONAL REQUIREMENTS):
${context}

CRITICAL RULE: You MUST combine and synthesize ALL requirements provided across the entire conversation history.
CRITICAL RULE: Output ONLY the requested format. Start immediately. No preamble, no "Here is...". NEVER truncate. ALWAYS generate the FULL complete output.
${isVisual ? `MANDATORY SCHEMA: You MUST return a strict JSON object with this exact structure:\n{\n  "summary": "A brief 1-2 sentence description",\n  "code": "The raw string of your code. Do NOT wrap in markdown fences inside the JSON string."\n}\nDO NOT output any markdown blocks outside the JSON.` : ''}
    `.trim();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      safetySettings,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 65536,
      }
    });

    let isClosed = false;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Heartbeat keep-alive
          controller.enqueue(new TextEncoder().encode(" "));
          const result = await model.generateContentStream(prompt);
          for await (const chunk of result.stream) {
            if (isClosed) break;
            let text = chunk.text();
            if (!isVisual) {
              text = text
                .replace(/\|?\s*-+->/g, ' --> ')
                .replace(/--\s*>/g, ' --> ')
                .replace(/\["([^\]]+)"\]/g, (m: string, label: string) => {
                  const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                  return `["${safeLabel}"]`;
                })
                .replace(/\{"([^"]+)"\}/g, (m: string, label: string) => {
                  const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
                  return `{"${safeLabel}"}`;
                });
            } else if (documentRequested === 'Prototypes' || documentRequested === 'Wireframes') {
              text = maskCardOutput(text);
            }
            controller.enqueue(new TextEncoder().encode(text));
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
