const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: { tasks: true }
  });
  
  projects.forEach(p => {
    console.log(`Project: ${p.title} (${p.id})`);
    console.log(`Tasks count: ${p.tasks.length}`);
    p.tasks.forEach(t => console.log(`  - [${t.status}] ${t.title}`));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
