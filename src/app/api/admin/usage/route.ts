import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const role = (session?.user as any)?.role;

  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [org, totalMembers, docsThisMonth, sessionsThisMonth, totalSessions] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.auditLog.count({
      where: { organizationId: orgId, action: 'DOCUMENT_GENERATED', createdAt: { gte: startOfMonth } }
    }),
    prisma.auditLog.count({
      where: { organizationId: orgId, action: 'SESSION_SAVED', createdAt: { gte: startOfMonth } }
    }),
    prisma.project.count({ where: { organizationId: orgId } }),
  ]);

  const usagePercent = org ? Math.round((totalMembers / org.maxUsers) * 100) : 0;

  return NextResponse.json({
    plan: org?.plan || 'STARTER',
    maxUsers: org?.maxUsers || 10,
    totalMembers,
    usagePercent,
    isNearLimit: usagePercent >= 80,
    isAtLimit: totalMembers >= (org?.maxUsers || 10),
    docsThisMonth,
    sessionsThisMonth,
    totalSessions,
    orgName: org?.name,
    isActive: org?.isActive,
  });
}
