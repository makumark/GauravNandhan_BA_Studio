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

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json([], { status: 200 }); // Solo users don't have org Devs
    }

    const devMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        role: 'DEVELOPER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    const developers = devMembers.map(m => m.user);
    return NextResponse.json(developers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
