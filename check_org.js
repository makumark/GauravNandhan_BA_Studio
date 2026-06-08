const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { memberships: true }
  });
  for (const u of users) {
    if (u.name === 'Y A Sastry' || u.name === 'K. Madhu Kumar') {
       console.log(u.name, "OrgId:", u.memberships[0]?.organizationId);
    }
  }

  const projects = await prisma.project.findMany({
    select: { id: true, title: true, organizationId: true, userId: true, status: true }
  });
  console.log("PROJECTS:", projects);
}
main().finally(() => prisma.$disconnect());
