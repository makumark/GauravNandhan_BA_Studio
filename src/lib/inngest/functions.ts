import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { AGENT_CONFIGS, GOLD_STANDARD_EXAMPLES } from "@/lib/agents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateVisualArtifacts = inngest.createFunction(
  { id: "generate-document-artifacts", event: "app/document.generate" },
  async ({ event, step }) => {
    const { 
      projectId, 
      documentRequested, 
      messages, 
      domainDetected, 
      functionalContext, 
      glossary,
      userEmail 
    } = event.data;

    const generatedContent = await step.run("generate-ai-content", async () => {
      const agent = AGENT_CONFIGS[documentRequested] || AGENT_CONFIGS.DEFAULT;
      const isVisual = documentRequested === 'Prototypes' || documentRequested === 'Wireframes' || documentRequested === 'UML Diagrams';
      const toolExample = GOLD_STANDARD_EXAMPLES[agent.tool] || "";

      // Build context: include ALL messages in order. Never slice — slicing drops earlier
      // requirements and causes the background generator to forget context.
      const uniqueMessages = messages.filter(Boolean);
      const context = (uniqueMessages as any[]).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

      const prompt = `
AGENT: ${agent.name}
SPECIALIZED TOOL: ${agent.tool}

${toolExample}

TASK: Generate a professional and comprehensive ${documentRequested}.
INSTRUCTIONS: ${agent.instruction}
DOMAIN: ${domainDetected || 'FinTech / Regulatory Technology'}
CURRENT DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${functionalContext ? `FUNCTIONAL REQUIREMENTS (SOURCE OF TRUTH):\n"""\n${functionalContext}\n"""` : ''}
${glossary && glossary.length > 0 ? `ENTITY DICTIONARY (MANDATORY CONSISTENCY):\n"""\n${JSON.stringify(glossary, null, 2)}\n"""\nYou MUST adhere strictly to these terms and rules.` : ''}
CONVERSATION CONTEXT:
${context}

CRITICAL RULE: Output ONLY the ${agent.tool} content. Start immediately. No preamble, no "Here is...", no markdown outside code fences. NEVER truncate or use placeholders like "... (skipping lines) ...". ALWAYS generate the FULL complete code.
${isVisual ? `MANDATORY INSTRUCTION: You MUST return ONLY the raw code (HTML/React for prototypes, PlantUML/Mermaid for UML/Flowcharts, JSON schema for Wireframes). DO NOT wrap it inside another JSON object. Just output the raw code block.` : ''}
      `.trim();

      const model = genAI.getGenerativeModel({
        model: isVisual ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
        }
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      // Nuclear Syntax Hardening (Mermaid) for text docs
      if (!isVisual) {
        text = text
          .replace(/\|?\s*-+\s*->/g, ' --> ') // Fix malformed arrows like | -- ->
          .replace(/--\s*>/g, ' --> ')        // Fix space in arrows
          .replace(/\["([^\]]+)"\]/g, (m, label) => {
            const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
            return `["${safeLabel}"]`;
          })
          .replace(/\{"([^"]+)"\}/g, (m, label) => {
            const safeLabel = label.replace(/[()]/g, '').replace(/\//g, ' ');
            return `{"${safeLabel}"}`;
          });
      }

      return text;
    });

    // Step 2: Save to Database
    await step.run("save-to-database", async () => {
      // Find existing document
      const existingDoc = await prisma.document.findFirst({
        where: { projectId, type: documentRequested }
      });

      if (existingDoc) {
        await prisma.document.update({
          where: { id: existingDoc.id },
          data: { content: generatedContent }
        });
      } else {
        await prisma.document.create({
          data: {
            projectId,
            type: documentRequested,
            content: generatedContent,
          }
        });
      }
      
      // Add audit log
      if (userEmail) {
        const org = await prisma.project.findUnique({
          where: { id: projectId },
          select: { organizationId: true, userId: true }
        });
        
        if (org && org.organizationId) {
           await prisma.auditLog.create({
             data: {
               organizationId: org.organizationId,
               userId: org.userId,
               userEmail: userEmail,
               action: 'DOCUMENT_GENERATED_BACKGROUND',
               resourceType: documentRequested,
             }
           });
        }
      }
    });

    return { success: true, documentType: documentRequested };
  }
);
