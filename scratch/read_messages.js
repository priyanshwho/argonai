const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log('--- RECENT CONVERSATIONS ---');
    for (const c of conversations) {
      console.log(`\nConversation ID: ${c.id}`);
      console.log(`Title: ${c.title}`);
      console.log(`Created At: ${c.createdAt}`);
      console.log(`Messages Count: ${c.messages.length}`);
      for (const m of c.messages) {
        console.log(`  [${m.role}] ${m.content.slice(0, 80)}...`);
      }
    }
  } catch (err) {
    console.error('Error querying prisma:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
