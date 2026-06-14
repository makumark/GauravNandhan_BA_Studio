import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const documents = await prisma.document.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      projectId: true,
      type: true,
      content: true,
      updatedAt: true
    }
  });

  for (const doc of documents) {
    console.log(`\n================================`);
    console.log(`Project: ${doc.projectId}`);
    console.log(`Type: ${doc.type}`);
    console.log(`Date: ${doc.updatedAt}`);
    console.log(`Content (first 200 chars):`);
    console.log(doc.content.substring(0, 200));
    console.log(`Content Length: ${doc.content.length}`);
    console.log(`================================\n`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
