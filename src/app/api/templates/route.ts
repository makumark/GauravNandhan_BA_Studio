import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    if (!orgId) return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });

    const templates = await prisma.template.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET Templates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';
    
    if (!orgId) return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });

    const { name, description, content } = await req.json();

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        content,
        organizationId: orgId
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: userId,
      userEmail: userEmail,
      action: 'DOCUMENT_GENERATED', // Reusing available enum for now, or we can use metadata
      resourceType: 'Template',
      resourceId: template.id,
      metadata: { action: 'TEMPLATE_CREATED' }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("POST Template Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
