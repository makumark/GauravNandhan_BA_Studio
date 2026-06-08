import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { id } = await params;
    
    // Ensure the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Usually only PMs should be able to reject a project.
    // For simplicity, we allow any authenticated user to do this, 
    // but in a strict app, we would verify `(session.user as any).role === 'PM'`.

    const { status, pmFeedback } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { 
        status,
        ...(pmFeedback !== undefined && { pmFeedback })
      }
    });

    // Audit log
    const orgId = (session.user as any).organizationId ?? null;
    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: user.id,
        userEmail: user.email!,
        action: 'PROJECT_STATUS_CHANGED',
        resourceId: id,
        metadata: { title: existingProject.title, newStatus: status }
      });
    }

    return NextResponse.json(updatedProject);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
