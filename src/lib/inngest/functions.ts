import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateVisualArtifacts = inngest.createFunction(
  { id: "generate-visual-artifacts", event: "app/document.generate" },
  async ({ event, step }) => {
    const { projectId, documentType, prompt, systemInstruction } = event.data;

    // Step 1: Tell AI to generate the heavy visual (UML/Prototype)
    const generatedContent = await step.run("generate-ai-content", async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    });

    // Step 2: Save directly to Neon Postgres
    await step.run("save-to-database", async () => {
      // Upsert the document into the database so the frontend can poll it
      await prisma.document.create({
        data: {
          projectId,
          type: documentType,
          content: generatedContent,
        }
      });
    });

    return { success: true, documentType };
  }
);
