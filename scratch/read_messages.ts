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
      console.log(`Loaded environment from ${file}. URL host: ${process.env.DATABASE_URL.split('@')[1] || 'unknown'}`);
      break;
    }
  }
}

async function main() {
  // Dynamically import db after env is set
  const { prisma } = await import('../lib/db');

  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    console.log('--- RECENT CONVERSATIONS ---');
    for (const c of conversations) {
      console.log(`\nConversation ID: ${c.id}`);
      console.log(`Title: ${c.title}`);
      console.log(`Messages Count: ${c.messages.length}`);
      for (const m of c.messages) {
        console.log(`  [${m.role}] ${m.content.slice(0, 100)}`);
      }
    }
  } catch (err: any) {
    console.error('Error fetching data:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
