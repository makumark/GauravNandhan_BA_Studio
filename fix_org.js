const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const madhuUser = await prisma.user.findFirst({ where: { email: 'kmadhukumar25@gmail.com' } });
  const pmUser = await prisma.user.findFirst({ where: { email: 'yeleswaram@gmail.com' } });

  const madhuMembership = await prisma.organizationMember.findFirst({ where: { userId: madhuUser.id } });
  const pmMembership = await prisma.organizationMember.findFirst({ where: { userId: pmUser.id } });

  console.log("Madhu Org:", madhuMembership.organizationId);
  console.log("PM Org before:", pmMembership.organizationId);

  await prisma.organizationMember.updateMany({
    where: { userId: pmUser.id },
    data: { organizationId: madhuMembership.organizationId, role: 'PM' }
  });

  console.log("Success! PM moved to Madhu's Org.");
}

main().finally(() => prisma.$disconnect());
