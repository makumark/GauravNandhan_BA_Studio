import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks } = await req.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });
    }

    // Using Prisma transactions to bulk update tasks
    const updatePromises = tasks.map((task: any) => 
      prisma.task.update({
        where: { id: task.taskId },
        data: {
          assigneeId: task.assigneeId || null,
          storyPoints: task.storyPoints || null,
          priority: task.priority || "MEDIUM"
        }
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true, updatedCount: tasks.length });
  } catch (error: any) {
    console.error("Sprint Planning bulk update error:", error);
    return NextResponse.json({ error: error.message || "Failed to save sprint plan" }, { status: 500 });
  }
}
