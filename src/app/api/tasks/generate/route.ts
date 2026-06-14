import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const customProvider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, pmId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { documents: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const brd = project.documents.find(d => d.type === 'BRD')?.content || '';
    const frd = project.documents.find(d => d.type === 'FRD')?.content || '';
    
    if (!brd && !frd) {
      return NextResponse.json({ error: 'No BRD or FRD found. Please generate them first.' }, { status: 400 });
    }

    const prompt = `You are a Senior Technical Project Manager.
Based on the following Business Requirements (BRD) and Functional Requirements (FRD), extract a comprehensive list of Epics and User Stories (Tasks) for a Kanban board.
Also, act as a Technical Lead to automatically estimate Story Points (using Fibonacci sequence 1, 2, 3, 5, 8, 13) and set Priority (HIGH, MEDIUM, LOW) based on business value and technical complexity.

BRD:
${brd.substring(0, 15000)}

FRD:
${frd.substring(0, 15000)}

Return ONLY a valid JSON array of Epics. Each Epic should contain an array of tasks.
Format exactly like this:
[
  {
    "name": "Epic 1: User Authentication",
    "tasks": [
      {
        "title": "As a user, I want to sign up with email and password",
        "description": "Acceptance Criteria:\\n- Validate email format\\n- Enforce strong password",
        "storyPoints": 5,
        "priority": "HIGH"
      }
    ]
  }
]`;

    const { robustGenerateText } = require('@/lib/llm');
    const result = await robustGenerateText({
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 8000,
    });
    const rawText = result.text.trim();
    
    let parsedData: any[] = [];
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) parsedData = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("AI failed to generate valid tasks.");
    }

    // Clean up existing sprints and tasks for this project before re-generating
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.sprint.deleteMany({ where: { projectId } });

    // Create a Sprint for the Kanban Board
    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name: `Sprint 1 - AI Generated`,
        status: "ACTIVE",
      }
    });

    const taskCreates = [];
    for (const epic of parsedData) {
      const epicName = epic.name || "General Requirements";
      const tasks = epic.tasks || [];
      for (const t of tasks) {
        taskCreates.push({
          projectId,
          sprintId: sprint.id,
          title: `[${epicName}] ${t.title || 'Untitled Task'}`,
          description: t.description || '',
          status: "TODO",
          storyPoints: typeof t.storyPoints === 'number' ? t.storyPoints : null,
          priority: ['HIGH', 'MEDIUM', 'LOW'].includes(t.priority) ? t.priority : "MEDIUM"
        });
      }
    }

    if (taskCreates.length > 0) {
      await prisma.task.createMany({ data: taskCreates });
    }

    // Update Project Status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "READY_FOR_PM", pmId: pmId || null }
    });

    return NextResponse.json({ success: true, taskCount: taskCreates.length });
  } catch (error: any) {
    console.error('Task Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
