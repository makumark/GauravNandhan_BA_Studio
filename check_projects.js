const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("USERS:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));

  const orgMembers = await prisma.organizationMember.findMany({
    include: { organization: true, user: true }
  });
  console.log("ORG MEMBERS:", orgMembers.map(m => ({ user: m.user.name, role: m.role, org: m.organization.name })));

  const projects = await prisma.project.findMany({
    include: { user: true, organization: true }
  });
  console.log("PROJECTS:", projects.map(p => ({ id: p.id, title: p.title, user: p.user?.name, orgId: p.organizationId, status: p.status })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
