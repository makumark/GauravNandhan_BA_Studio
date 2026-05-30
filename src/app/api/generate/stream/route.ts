import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from '@/lib/agents';
import { sanitizeInput } from '@/lib/pii';

export const runtime = 'edge'; // MUST BE EDGE for infinite streaming

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      documentRequested,
      domainDetected,
      functionalContext: encodedFunctionalContext,
      glossary
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
    const isVisual = documentRequested === 'Prototypes' || documentRequested === 'Wireframes' || documentRequested === 'UML Diagrams';
    const toolExample = GOLD_STANDARD_EXAMPLES[agent.tool as keyof typeof GOLD_STANDARD_EXAMPLES] || "";

    const contextSize = documentRequested ? -15 : -5;
    const momMessage = sanitizedMessages.find((m: any, i: number) => i === 0 || m.role === 'user');
    const recentMessages = sanitizedMessages.slice(contextSize);
    
    // Deduplicate
    const uniqueMessages = Array.from(new Map(
      [momMessage, ...recentMessages].filter(Boolean).map((m: any) => [m.content, m])
    ).values());
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

    const isPrototype = documentRequested === 'Prototypes';
    const model = genAI.getGenerativeModel({
      model: isPrototype ? 'gemini-1.5-flash' : 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      }
    });

    const result = await model.generateContentStream(prompt);
    
    // Convert Gemini stream to web standard stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error: any) {
    console.error('Edge Stream Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
