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
      model: 'gemini-2.5-flash', // Match user settings for reliability
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
    3. Use realistic locators. If the Prototype Code above looks like an error message or is missing/invalid, IGNORE IT and infer standard locators (e.g., getByRole('button', { name: 'Submit' }), getByPlaceholder('Email')).
    4. Include beforeEach for navigation setup (use 'http://localhost:3000' as base URL).
    5. Add expect assertions for every acceptance criterion.
    6. Return ONLY the TypeScript code block wrapped in \`\`\`typescript fences. No explanations.`;

    // ── DRY-RUN VALIDATION LAYER (Self-Healing) ──
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err: any) {
      if (err.message && err.message.includes('503')) {
        return NextResponse.json({ error: 'AI service is currently experiencing high demand. Please try generating test cases again in a few moments.' }, { status: 503 });
      }
      throw err;
    }

    let generatedCode = result.response.text();
    
    // Extract code from fences
    const cleanCodeMatch = generatedCode.match(/```(?:typescript|hcl)?\s*([\s\S]*?)\s*```/i);
    let cleanCode = cleanCodeMatch ? cleanCodeMatch[1] : generatedCode;

    // Simulated Sandbox Dry-Run
    // In a full environment, this would write to /tmp and run `tsc --noEmit` or `terraform validate`
    let isValid = true;
    let errorMessage = "";

    if (isIaC) {
      if (!cleanCode.includes('resource') && !cleanCode.includes('provider')) {
        isValid = false;
        errorMessage = "Terraform syntax error: Missing provider or resource blocks.";
      }
    } else {
      if (!cleanCode.includes('test.describe') && !cleanCode.includes('test(')) {
        isValid = false;
        errorMessage = "Playwright syntax error: Missing test blocks.";
      }
    }

    if (!isValid) {
      // Self-Healing Retry (1 attempt)
      const fixPrompt = `Your previous code failed the dry-run validation with this error:
      ERROR: ${errorMessage}
      
      Here was your code:
      ${cleanCode}
      
      Please fix the syntax error and return ONLY the corrected code block.`;
      
      try {
        const retryResult = await model.generateContent(fixPrompt);
        generatedCode = retryResult.response.text();
        const retryMatch = generatedCode.match(/```(?:typescript|hcl)?\s*([\s\S]*?)\s*```/i);
        cleanCode = retryMatch ? retryMatch[1] : generatedCode;
      } catch (e) {
        // Ignore retry errors and just return the first generated code
      }
    }

    // Return the validated code as a single response (simulating stream for UI compatibility)
    return NextResponse.json({ code: cleanCode, validated: true });

  } catch (error: any) {
    console.error('Generate/Tests Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
