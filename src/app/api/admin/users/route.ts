import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — list all members of the org
export async function GET() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const role = (session?.user as any)?.role;

  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' }
  });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });

  return NextResponse.json({ members, org });
}

// POST /api/admin/users — invite a new user (creates account + adds to org)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const adminId = (session?.user as any)?.id;
  const adminEmail = session?.user?.email!;
  const role = (session?.user as any)?.role;

  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageUsers(role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { email, name, memberRole = 'BA_ANALYST' } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Check license limit
  const [org, currentCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.organizationMember.count({ where: { organizationId: orgId } })
  ]);

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  if (currentCount >= org.maxUsers) {
    return NextResponse.json({
      error: `License limit reached. Your ${org.plan} plan allows ${org.maxUsers} users. Please upgrade to add more.`
    }, { status: 429 });
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // For Phase 2 Testing: Set a known temporary password
    const tempPassword = "Welcome@2026";
    const hashed = await bcrypt.hash(tempPassword, 12);
    user = await prisma.user.create({ data: { name, email, password: hashed } });
  }

  // Check if already a member
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } }
  });
  if (existing) return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });

  const member = await prisma.organizationMember.create({
    data: { userId: user.id, organizationId: orgId, role: memberRole },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  await logAudit({
    organizationId: orgId,
    userId: adminId,
    userEmail: adminEmail,
    action: 'USER_INVITED',
    metadata: { invitedEmail: email, assignedRole: memberRole }
  });

  return NextResponse.json(member);
}

// PATCH /api/admin/users — edit a member (role, name, password, status)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const adminId = (session?.user as any)?.id;
  const adminEmail = session?.user?.email!;
  const role = (session?.user as any)?.role;

  if (!orgId || !canManageUsers(role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { memberId, newRole, newName, newEmail, newPassword, newStatus } = await req.json();
  
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { user: true }
  });
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const updates: any = {};
  const userUpdates: any = {};
  const auditLogs: any[] = [];

  if (newRole) {
    const validRoles = ['ADMIN', 'BA_LEAD', 'BA_ANALYST', 'PM', 'DEVELOPER', 'QA_VIEWER', 'VIEWER'];
    if (validRoles.includes(newRole)) {
      updates.role = newRole;
      auditLogs.push({ action: 'ROLE_CHANGED', metadata: { targetEmail: member.user.email, newRole } });
    }
  }

  if (newName) {
    userUpdates.name = newName;
    auditLogs.push({ action: 'NAME_UPDATED', metadata: { targetEmail: member.user.email, newName } });
  }

  if (newEmail && newEmail !== member.user.email) {
    // Check if new email is already taken
    const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
    if (conflict) return NextResponse.json({ error: 'This email is already in use by another user' }, { status: 409 });
    
    userUpdates.email = newEmail;
    auditLogs.push({ action: 'EMAIL_UPDATED', metadata: { oldEmail: member.user.email, newEmail } });
  }

  if (newPassword) {
    userUpdates.password = await bcrypt.hash(newPassword, 12);
    auditLogs.push({ action: 'PASSWORD_RESET', metadata: { targetEmail: member.user.email } });
  }

  if (newStatus !== undefined) {
    updates.isActive = newStatus;
    auditLogs.push({ 
      action: newStatus ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 
      metadata: { targetEmail: member.user.email } 
    });
  }

  const updatedMember = await prisma.organizationMember.update({
    where: { id: memberId },
    data: {
      ...updates,
      user: { update: userUpdates }
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  // Log all changes
  for (const log of auditLogs) {
    await logAudit({
      organizationId: orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: log.action,
      metadata: log.metadata
    });
  }

  return NextResponse.json(updatedMember);
}

// DELETE /api/admin/users — remove a member from org
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;
  const adminId = (session?.user as any)?.id;
  const adminEmail = session?.user?.email!;
  const role = (session?.user as any)?.role;

  if (!orgId || !canManageUsers(role)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { memberId } = await req.json();

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { user: { select: { email: true, id: true } } }
  });
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Prevent removing yourself
  if (member.userId === adminId) {
    return NextResponse.json({ error: 'You cannot remove yourself from the organization' }, { status: 400 });
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });

  await logAudit({
    organizationId: orgId,
    userId: adminId,
    userEmail: adminEmail,
    action: 'USER_REMOVED',
    metadata: { removedEmail: member.user.email }
  });

  return NextResponse.json({ success: true });
}
