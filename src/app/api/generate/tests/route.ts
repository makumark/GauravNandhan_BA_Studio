import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Allow long-running AI generations on Vercel to prevent 504 timeouts
export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { prototypeCode, testCases } = await req.json();

    if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // UPDATED: gemini-1.5-flash deprecated

    const isIaC = prototypeCode === "GENERATE_IAC";

    const prompt = isIaC 
      ? `Generate a production-grade Terraform (HCL) manifest based on the following System Requirements (SRD).
    
    SRD Content:
    ${testCases}

    MANDATORY RULES:
    1. Define a scalable cloud architecture (AWS/Azure).
    2. Include networking (VPC/Subnets), Database (Postgres/RDS), and Compute (EKS/Lambda).
    3. Include security groups and IAM roles.
    4. Ensure best practices (tagging, modularity).
    
    Return ONLY the code block.`
      : `Generate a high-fidelity Playwright (TypeScript) end-to-end test script based on the following Prototype code and Test Cases.
    
    Prototype (Alpine.js/Tailwind):
    ${prototypeCode}

    Target Test Cases:
    ${testCases}
    
    Return ONLY the code block.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Dynamically match ANY code block (typescript, hcl, terraform, or empty) and capture the content
    const codeMatch = text.match(/```\w*\s*([\s\S]*?)\s*```/);
    const finalCode = codeMatch && codeMatch[1] ? codeMatch[1].trim() : text;

    return NextResponse.json({ script: finalCode });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
