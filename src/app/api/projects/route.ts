import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: true,
        documents: true
      }
    });

    return NextResponse.json(projects);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { title, messages, documents } = await req.json();

    const project = await prisma.project.create({
      data: {
        title: title || 'New BA Session',
        userId: user.id,
        messages: {
          create: messages.map((m: any) => ({
            role: m.role,
            content: m.content
          }))
        },
        documents: {
          create: Object.entries(documents || {}).map(([type, content]: [string, any]) => ({
            type,
            content
          }))
        }
      }
    });

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
