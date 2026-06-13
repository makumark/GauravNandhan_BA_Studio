import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || 'custom-key',
});

export const processChatChunks = inngest.createFunction(
  { 
    id: "process-chat-chunks", 
    name: "Process Chat Chunks for Requirements",
    concurrency: 10 // Prevent server crash by limiting to 10 concurrent processes
  },
  { event: "chat/extract.requirements" },
  async ({ event, step }) => {
    const { projectId } = event.data;

    // Step 1: Fetch recent unprocessed messages (Chunking)
    const messages = await step.run("fetch-messages", async () => {
      // In a real implementation, we'd add an `isProcessed` flag to Message schema.
      // For this MVP, we take the last 50 messages to represent a "chunk".
      return await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    if (messages.length === 0) return { success: true, extracted: 0 };

    // Sort ascending for context flow
    const orderedMessages = messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Step 2: Extract requirements using Local/OS API
    const extractedNodes = await step.run("extract-requirements", async () => {
      const chatText = orderedMessages.map((m) => `${m.role}: ${m.content}`).join("\n");
      
      const prompt = `
        You are a Business Analyst extraction engine. 
        Extract system requirements, screens, APIs, and test cases from the following chat.
        Return ONLY a raw JSON array of objects without markdown formatting or backticks.
        Structure: [{ "nodeId": "REQ-1", "nodeType": "REQUIREMENT", "label": "User can login via Google" }]
        Valid nodeTypes: REQUIREMENT, SCREEN, API, TEST_CASE, EPIC, FEATURE, DOCUMENT
        
        Chat context:
        ${chatText}
      `;

      try {
        const { text } = await generateText({
          model: customProvider(process.env.LLM_MODEL_NAME || 'qwen2.5'),
          prompt: prompt,
        });
        
        let responseText = text;
        
        // Clean up markdown code blocks if the AI includes them
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(responseText) as { nodeId: string, nodeType: string, label: string }[];
      } catch (e) {
        console.error("Failed to parse AI output", e);
        return [];
      }
    });

    // Step 3: Save to Structured Knowledge Base (GraphNode)
    if (extractedNodes.length > 0) {
      await step.run("save-to-database", async () => {
        for (const node of extractedNodes) {
          // Store each extracted piece of knowledge into the Graph Database Layer
          // This avoids passing 1000 pages of chat next time
          await prisma.graphNode.upsert({
            where: { 
              projectId_nodeId: { projectId, nodeId: node.nodeId } 
            },
            update: { 
              label: node.label, 
              nodeType: node.nodeType 
            },
            create: {
              projectId,
              nodeId: node.nodeId,
              nodeType: node.nodeType,
              label: node.label
            }
          });
        }
      });
    }

    return { success: true, extracted: extractedNodes.length };
  }
);
