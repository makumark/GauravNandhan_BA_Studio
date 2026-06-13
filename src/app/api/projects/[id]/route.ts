import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canSaveSessions } from '@/lib/permissions';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    
    // Ensure the project exists and belongs to the user or org
    const orgId = (session.user as any).organizationId ?? null;
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.organizationId && existingProject.organizationId !== orgId) {
       return NextResponse.json({ error: 'Unauthorized access to organization project' }, { status: 403 });
    }
    
    if (!existingProject.organizationId && existingProject.userId !== user.id) {
       return NextResponse.json({ error: 'Unauthorized access to personal project' }, { status: 403 });
    }

    const { messages, documents } = await req.json();

    // To cleanly update messages, we delete the old ones and create the new ones.
    // An alternative is an upsert, but since we receive the full chat array, deletion/recreation is robust.
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { projectId: id } }),
      prisma.message.createMany({
        data: messages.map((m: any) => ({
          projectId: id,
          role: m.role,
          content: m.content
        }))
      })
    ]);

    // Handle documents similarly if provided (often documents might just be omitted if unchanged, so we update what's passed)
    if (documents && Object.keys(documents).length > 0) {
      // For simplicity, if documents are passed, we overwrite all for this project to match the current state.
      await prisma.document.deleteMany({ where: { projectId: id } });
      await prisma.document.createMany({
        data: Object.entries(documents).map(([type, doc]: [string, any]) => ({
          projectId: id,
          type,
          content: typeof doc === 'string' ? doc : doc.content
        }))
      });
    }

    // Audit log
    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: user.id,
        userEmail: user.email!,
        action: 'SESSION_SAVED', // Using existing action name
        resourceId: id,
        metadata: { title: existingProject.title, update: true }
      });
    }

    // Trigger background requirement extraction
    try {
      await inngest.send({
        name: 'chat/extract.requirements',
        data: { projectId: id }
      });
    } catch (inngestErr) {
      console.error("Failed to trigger Inngest extraction:", inngestErr);
    }

    // Return the updated project
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: { messages: true, documents: true }
    });

    return NextResponse.json(updatedProject);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { id } = await params;
    const orgId = (session.user as any).organizationId ?? null;
    
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.organizationId && existingProject.organizationId !== orgId) {
       return NextResponse.json({ error: 'Unauthorized access to organization project' }, { status: 403 });
    }
    
    if (!existingProject.organizationId && existingProject.userId !== user.id) {
       return NextResponse.json({ error: 'Unauthorized access to personal project' }, { status: 403 });
    }

    // Delete project completely
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { projectId: id } }),
      prisma.document.deleteMany({ where: { projectId: id } }),
      prisma.project.delete({ where: { id } })
    ]);

    // Audit log
    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: user.id,
        userEmail: user.email!,
        action: 'PROJECT_DELETED',
        resourceId: id,
        metadata: { title: existingProject.title }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
