import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { AGENT_CONFIGS } from "@/lib/agents";

import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { projectId, artifactType } = await req.json(); // e.g. "UML", "BRD", "WIREFRAME"

    if (!projectId || !artifactType) {
      return NextResponse.json({ error: "Missing projectId or artifactType" }, { status: 400 });
    }

    // LAYER 2: Fetch only relevant Structured Data (Knowledge Base)
    // We DO NOT fetch the 1000-page message history here. 
    // We only fetch the summarized nodes.
    const nodes = await prisma.graphNode.findMany({
      where: { projectId },
      select: { nodeId: true, nodeType: true, label: true }
    });

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "No requirements extracted yet. Please chat more or wait for background processing." }, 
        { status: 400 }
      );
    }

    // Prepare targeted context
    const contextLines = nodes.map(n => `[${n.nodeType}] ${n.nodeId}: ${n.label}`).join("\n");

    const agent = AGENT_CONFIGS[artifactType] || AGENT_CONFIGS['BRD'];
    
    const prompt = `
AGENT: ${agent.name}
SPECIALIZED TOOL: ${agent.tool}

TASK: Generate a professional and comprehensive ${artifactType}.
INSTRUCTIONS: ${agent.instruction}

Based on the following extracted requirements:
${contextLines}

CRITICAL RULE: Output ONLY the requested format. Start immediately. No preamble, no "Here is...".
    `.trim();

    const { text } = await generateText({
      model: google(process.env.GEMINI_MODEL_NAME || 'gemini-2.5-pro'),
      prompt: prompt,
    });
    
    let content = text.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-z]*\n?/i, '');
      content = content.replace(/```$/i, '').trim();
    }

    return NextResponse.json({ success: true, content });

  } catch (error) {
    console.error("Artifact Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate artifact" }, { status: 500 });
  }
}
