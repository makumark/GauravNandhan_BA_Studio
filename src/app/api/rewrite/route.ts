import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    const limiter = rateLimit(userId || userEmail, 10, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { documentContent, selectedText, instruction } = await req.json();

    if (!documentContent || !selectedText || !instruction) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { temperature: 0.2 },
    });

    const prompt = `You are a Senior Business Analyst. A user wants to rewrite a specific section of a document.
    
FULL DOCUMENT CONTEXT:
"""
${documentContent.substring(0, 3000)}... (truncated for context)
"""

ORIGINAL SELECTED TEXT:
"""
${selectedText}
"""

USER INSTRUCTION FOR REWRITE:
"${instruction}"

Your task is to provide ONLY the rewritten text that will replace the ORIGINAL SELECTED TEXT.
Do NOT include the rest of the document. Do NOT include markdown fences if the original text didn't have them (unless specifically asked to format as code).
Output ONLY the replacement text.`;

    const result = await model.generateContentStream(prompt);

    let isClosed = false;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            if (isClosed) break;
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (e: any) {
          if (!isClosed) {
            isClosed = true;
            controller.error(e);
          }
        } finally {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        }
      },
      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to rewrite text' }, { status: 500 });
  }
}
