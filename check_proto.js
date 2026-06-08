const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const proj = await prisma.project.findFirst({ where: { title: 'Personal Banking' }, include: { documents: true } });
  const proto = proj.documents.find(d => d.type === 'Prototypes');
  console.log("PROTOTYPE:", proto?.content ? proto.content.slice(0, 500) : "NONE");
  const wf = proj.documents.find(d => d.type === 'Wireframes');
  console.log("WIREFRAMES:", wf?.content ? wf.content.slice(0, 500) : "NONE");
}
check().finally(()=>prisma.$disconnect());
