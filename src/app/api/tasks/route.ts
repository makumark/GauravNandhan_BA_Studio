import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { comments: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(tasks);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { taskId, status, feedback } = await req.json();

    const updateData: any = { status };

    if (feedback && status === "NEEDS_REVISION") {
      updateData.comments = {
        create: {
          userId,
          content: feedback
        }
      };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
