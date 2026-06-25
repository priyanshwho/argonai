import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load local env files first before importing any module
const envFiles = ['.env.local', '.env', '.env.production'];
for (const file of envFiles) {
  const p = path.resolve(process.cwd(), file);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    if (process.env.DATABASE_URL) {
      break;
    }
  }
}

async function main() {
  const { prisma } = await import('../lib/db');
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { content: { contains: 'importnt' } },
          { content: { contains: 'remainder for tommeror' } },
          { content: { contains: 'shift the meeting to 26th' } }
        ]
      },
      include: {
        conversation: true
      }
    });

    console.log('--- FOUND MESSAGES ---');
    for (const m of messages) {
      console.log(`Msg ID: ${m.id}, Conv ID: ${m.conversationId}, Title: ${m.conversation.title}`);
      console.log(`[${m.role}] ${m.content}`);
      
      // Let's print all messages in this conversation
      const allMsgs = await prisma.message.findMany({
        where: { conversationId: m.conversationId },
        orderBy: { timestamp: 'asc' }
      });
      console.log(`Total messages in conversation: ${allMsgs.length}`);
      for (const am of allMsgs) {
        console.log(`  - [${am.role}] ${am.content.slice(0, 100)}`);
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
