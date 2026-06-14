import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { robustGenerateText } from '@/lib/llm';
import { AGENT_CONFIGS } from "@/lib/agents";

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

    let contextLines = "";
    if (nodes.length === 0) {
      // Fallback: If no nodes are extracted yet, use recent chat messages
      const recentMessages = await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 30
      });
      
      if (recentMessages.length === 0) {
        return NextResponse.json(
          { error: "No requirements extracted yet. Please chat more to generate artifacts." }, 
          { status: 400 }
        );
      }
      
      const orderedMessages = recentMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      contextLines = orderedMessages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n");
    } else {
      // Prepare targeted context from GraphNodes
      contextLines = nodes.map(n => `[${n.nodeType}] ${n.nodeId}: ${n.label}`).join("\n");
    }

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

    const { text } = await robustGenerateText({
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
