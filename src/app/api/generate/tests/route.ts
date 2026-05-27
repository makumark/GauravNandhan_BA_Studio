import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Raised to 120s (same as /api/chat) so large test suites fully complete
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function POST(req: Request) {
  try {
    const { prototypeCode, testCases } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro', // Match user settings for reliability
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
      safetySettings,
    });

    const isIaC = prototypeCode === 'GENERATE_IAC';

    const prompt = isIaC
      ? `Generate a production-grade Terraform (HCL) manifest based on the following System Requirements (SRD).
    
    SRD Content:
    ${testCases}

    MANDATORY RULES:
    1. Define a scalable cloud architecture (AWS/Azure).
    2. Include networking (VPC/Subnets), Database (Postgres/RDS), and Compute (EKS/Lambda).
    3. Include security groups and IAM roles.
    4. Ensure best practices (tagging, modularity).
    
    Return ONLY the HCL code block wrapped in \`\`\`hcl fences.`
      : `Generate a high-fidelity Playwright (TypeScript) end-to-end test script based on the following Test Cases and Prototype code.

    Test Cases (Source of Truth):
    ${testCases}

    Prototype/Wireframe Code (for locator reference):
    ${prototypeCode}

    MANDATORY RULES:
    1. Use @playwright/test imports. Use test.describe and test blocks.
    2. Map EVERY test case to a separate test() block. Use the TC-ID as the test name.
    3. Use realistic locators: getByRole, getByLabel, getByPlaceholder, getByTestId — in that order of preference.
    4. Include beforeEach for navigation setup (use 'http://localhost:3000' as base URL).
    5. Add expect assertions for every acceptance criterion.
    6. Return ONLY the TypeScript code block wrapped in \`\`\`typescript fences. No explanations.`;

    // ── Use streaming (same pattern as /api/chat) to prevent 504 timeouts ──
    const result = await model.generateContentStream(prompt);

    let isClosed = false;
    let accumulated = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            if (isClosed) break;
            const text = chunk.text();
            if (text) {
              accumulated += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (e: any) {
          console.error('Generate/Tests Stream Error:', e);
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

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('Generate/Tests Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
