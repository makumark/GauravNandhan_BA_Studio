import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });

    const { name, content } = await req.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.template.findUnique({ where: { id: params.id } });
    if (!existing || existing.organizationId !== orgId) {
       return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    const template = await prisma.template.update({
      where: { id: params.id },
      data: { name, content }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("PUT Template Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });

    // Verify ownership
    const existing = await prisma.template.findUnique({ where: { id: params.id } });
    if (!existing || existing.organizationId !== orgId) {
       return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    await prisma.template.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Template Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
