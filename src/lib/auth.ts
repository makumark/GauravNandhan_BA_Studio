import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit } from "./audit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
              orderBy: { joinedAt: 'asc' }
            }
          }
        });

        if (!user || !user?.password) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return user as any;
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_dev",
  pages: { signIn: '/login' },
  events: {
    async signIn({ user }) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id }
      });
      
      if (membership) {
        await logAudit({
          organizationId: membership.organizationId,
          userId: user.id,
          userEmail: user.email || "unknown",
          action: "LOGIN",
          metadata: { timestamp: new Date().toISOString() }
        });
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, enrich token with org + role
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
              orderBy: { joinedAt: 'asc' }
            }
          }
        });

        if (dbUser?.memberships?.[0]) {
          const membership = dbUser.memberships[0];
          token.organizationId = membership.organizationId;
          token.orgName = membership.organization.name;
          token.role = membership.role;
          token.plan = membership.organization.plan;
          token.maxUsers = membership.organization.maxUsers;
          token.isOrgActive = membership.organization.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).orgName = token.orgName;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).maxUsers = token.maxUsers;
        (session.user as any).isOrgActive = token.isOrgActive;
      }
      return session;
    }
  }
};
