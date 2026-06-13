import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || 'custom-key',
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

    let prompt = "";
    if (artifactType === "UML") {
      prompt = `
        Based on the following extracted requirements, generate a complete PlantUML sequence diagram.
        Output ONLY the raw PlantUML code between @startuml and @enduml.
        Requirements:
        ${contextLines}
      `;
    } else if (artifactType === "WIREFRAME") {
      prompt = `
        Based on the following extracted requirements (specifically SCREENS), generate a structural wireframe layout in Markdown.
        Requirements:
        ${contextLines}
      `;
    } else {
      prompt = `
        Based on the following extracted requirements, generate a ${artifactType} document in Markdown format.
        Structure it professionally with headings.
        Requirements:
        ${contextLines}
      `;
    }

    const { text } = await generateText({
      model: customProvider(process.env.LLM_MODEL_NAME || 'qwen2.5'),
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
