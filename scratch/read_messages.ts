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
      console.log(`Loaded environment from ${file}.`);
      break;
    }
  }
}

async function main() {
  // Dynamically import db after env is set
  const { prisma } = await import('../lib/db');

  try {
    const messages = await prisma.message.findMany({
      where: {
        content: {
          contains: 'officially created the draft email'
        }
      }
    });

    console.log(`\n==================================================`);
    console.log(`Found ${messages.length} messages matching "officially created the draft email"`);
    console.log(`==================================================\n`);

    for (const m of messages) {
      console.log(`Conversation ID: ${m.conversationId}`);
      console.log(`Message ID: ${m.id}`);
      console.log(`Raw Content:\n${m.content}`);
      console.log('--------------------------------------------------\n');
    }
  } catch (err: any) {
    console.error('Error fetching data:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
