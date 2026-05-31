import { NextResponse } from 'next/server';
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from '@/lib/agents';
import { sanitizeInput } from '@/lib/pii';

export const runtime = 'edge';

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

    // Provide the FULL conversation history to ensure no requirements are dropped
    const uniqueMessages = Array.from(new Map(
      sanitizedMessages.filter(Boolean).map((m: any) => [m.content, m])
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
${templateContent ? `\nCORPORATE TEMPLATE STRUCTURE (MANDATORY FORMATTING):\n"""\n${templateContent}\n"""\nCRITICAL RULE: You MUST output your response strictly adhering to the exact headers, numbering, and structure provided in the CORPORATE TEMPLATE STRUCTURE above. Do NOT use your own default format.\n` : ''}
CONVERSATION CONTEXT (INITIAL AND ADDITIONAL REQUIREMENTS):
${context}

CRITICAL RULE: You MUST combine and synthesize ALL requirements provided across the entire conversation history. Do not drop any previously established requirements unless explicitly overridden by a newer message.
CRITICAL RULE: Output ONLY the requested format. Start immediately. No preamble, no "Here is...". NEVER truncate or use placeholders like "... (skipping lines) ...". ALWAYS generate the FULL complete code.
    `.trim();

    return NextResponse.json({ 
      prompt, 
      modelName: isVisual ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
      // Provide the key safely for client-side streaming of this specific request
      apiKey: process.env.GEMINI_API_KEY || ''
    });

  } catch (error: any) {
    console.error('Prompt Compilation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
