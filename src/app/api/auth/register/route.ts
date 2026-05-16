import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, email, password, companyName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing info' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a unique org slug from the company name or user's name
    const baseSlug = (companyName || name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create user + org + admin membership in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword }
      });

      const org = await tx.organization.create({
        data: {
          name: companyName || (name ? `${name}'s Workspace` : `${email.split('@')[0]}'s Workspace`),
          slug,
          plan: 'STARTER',
          maxUsers: 10,
          isActive: true,
        }
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'ADMIN',
        }
      });

      return { user, org };
    });

    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      organizationId: result.org.id,
      orgName: result.org.name,
      role: 'ADMIN',
    });
  } catch (error: any) {
    console.error('[Register]', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
