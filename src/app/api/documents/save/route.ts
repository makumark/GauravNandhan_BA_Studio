import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, documentType, content } = await req.json();

    if (!projectId || !documentType || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user owns the project (or is in the org)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, organizationId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Basic ownership check
    if (project.userId !== userId && !project.organizationId) {
      return NextResponse.json({ error: 'Unauthorized for this project' }, { status: 403 });
    }

    // Find existing document
    const existingDoc = await prisma.document.findFirst({
      where: { projectId, type: documentType }
    });

    if (existingDoc) {
      await prisma.document.update({
        where: { id: existingDoc.id },
        data: { content }
      });
    } else {
      await prisma.document.create({
        data: {
          projectId,
          type: documentType,
          content,
        }
      });
    }

    // Add audit log if part of an org
    if (project.organizationId) {
      await prisma.auditLog.create({
        data: {
          organizationId: project.organizationId,
          userId: userId,
          userEmail: userEmail,
          action: 'DOCUMENT_GENERATED_REALTIME',
          resourceType: documentType,
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error saving document:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}
