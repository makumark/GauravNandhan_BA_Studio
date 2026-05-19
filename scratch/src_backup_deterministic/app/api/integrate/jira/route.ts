import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    const { frdContent, projectName } = await req.json();

    if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Convert the following Functional Requirements Document (FRD) into a structured Jira Ticket Manifest (Epics, User Stories, and Tasks).
    
    FRD Content:
    ${frdContent}

    Project Name: ${projectName}

    Return a JSON object with the following structure:
    {
      "epic": {
        "title": "Epic Title",
        "description": "High-level summary",
        "stories": [
          {
            "title": "Story Title",
            "description": "As a [user], I want [action] so that [value]",
            "acceptanceCriteria": ["list", "of", "criteria"],
            "priority": "High|Medium|Low",
            "tasks": ["Task 1", "Task 2"]
          }
        ]
      }
    }
    Return ONLY the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    let manifest;
    try {
      manifest = JSON.parse(text.replace(/```json|```/g, ''));
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      manifest = match ? JSON.parse(match[0]) : { error: "Failed to parse manifest" };
    }

    await logAudit({
      organizationId: orgId,
      userId: userId,
      userEmail: userEmail,
      action: 'JIRA_SYNC',
      resourceType: 'Project',
      resourceId: projectName,
      metadata: { frdLength: frdContent?.length }
    });

    return NextResponse.json(manifest);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
