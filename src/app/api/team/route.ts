import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } }
  });

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const orgId = (session?.user as any)?.organizationId;

  if (!canManageUsers(userRole) || !orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, role } = await req.json();

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: email.split('@')[0] }
    });
  }

  const member = await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    update: { role, isActive: true },
    create: { userId: user.id, organizationId: orgId, role }
  });

  return NextResponse.json(member);
}
