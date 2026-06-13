import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canSaveSessions } from '@/lib/permissions';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const orgId = (session.user as any).organizationId;
    const role = (session.user as any).role;

    // If user belongs to an org, return org-scoped projects; otherwise personal projects
    const projects = await prisma.project.findMany({
      where: orgId
        ? { 
            organizationId: orgId,
            ...(role === 'PM' ? { OR: [{ pmId: user.id }, { userId: user.id }] } : {})
          }
        : { userId: user.id, organizationId: null },
      orderBy: { updatedAt: 'desc' },
      include: { messages: true, documents: true }
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

    const role = (session.user as any).role;
    if (!canSaveSessions(role)) {
      return NextResponse.json({ error: 'Insufficient permissions. Viewer role cannot save sessions.' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { title, messages, documents } = await req.json();
    const orgId = (session.user as any).organizationId ?? null;

    const project = await prisma.project.create({
      data: {
        title: title || 'New BA Session',
        userId: user.id,
        organizationId: orgId,
        messages: {
          create: messages.map((m: any) => ({ role: m.role, content: m.content }))
        },
        documents: {
          create: Object.entries(documents || {}).map(([type, content]: [string, any]) => ({ type, content }))
        }
      }
    });

    // Audit log
    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: user.id,
        userEmail: user.email!,
        action: 'SESSION_SAVED',
        resourceId: project.id,
        metadata: { title: project.title, documentCount: Object.keys(documents || {}).length }
      });
    }

    // Trigger background requirement extraction
    try {
      await inngest.send({
        name: 'chat/extract.requirements',
        data: { projectId: project.id }
      });
    } catch (inngestErr) {
      console.error("Failed to trigger Inngest extraction:", inngestErr);
    }

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
