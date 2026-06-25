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
  const { prisma } = await import('../lib/db');
  const { getGoogleModel } = await import('../lib/ai');
  const { getCorsairAiTools } = await import('../lib/ai-tools');
  const { streamText, stepCountIs, tool } = await import('ai');
  const { z } = await import('zod');

  // Find Edu Sphere user
  const user = await prisma.user.findFirst({
    where: { email: 'eduspherepu@gmail.com' }
  });

  if (!user) {
    console.error('User eduspherepu@gmail.com not found in DB!');
    return;
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // Let's check integration accounts
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId: user.id },
    include: { integration: true },
  });
  console.log(`Found ${accounts.length} integration accounts:`, accounts.map(a => a.integration.name));

  const hasGmail = accounts.some((a) => a.integration.name === "gmail");
  const hasCalendar = accounts.some((a) => a.integration.name === "googlecalendar");

  const rawAiTools = getCorsairAiTools(user.id);
  const aiTools = {
    ...rawAiTools,
    draft_email: tool({
      description: 'Use this tool to draft an email when the user wants to send an email or message via Gmail.',
      inputSchema: z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string(),
        threadId: z.string().optional()
      }),
      execute: async (args: any) => args
    }),
    draft_calendar_event: tool({
      description: 'Use this tool to draft a Google Calendar event.',
      inputSchema: z.object({
        title: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        attendees: z.array(z.string()).optional()
      }),
      execute: async (args: any) => args
    })
  };

  const model = await getGoogleModel();

  console.log('Successfully loaded model and tools. Testing streamText call with empty/simple messages...');
  
  const systemPrompt = `You are ArgonAI, an AI-powered workspace assistant.
You manage the user's Gmail and Google Calendar.
You can read their emails, draft responses, find calendar availability, and schedule meetings.
Be concise, helpful, and professional.

CRITICAL: When the user wants to write an email, draft an email, reply to an email, or send an email, you MUST call the "draft_email" tool to present a draft card to the user. Do NOT write the email subject, recipient, or body as plain text in your chat response. You must always invoke the "draft_email" tool so that the user receives an interactive card.
When the user wants to schedule, create, or book a calendar event, you MUST call the "draft_calendar_event" tool to present the event details to the user for approval. Do NOT write the event details as plain text in your chat response. You must always invoke the "draft_calendar_event" tool to render the animated visual conflict checker card.
Do NOT execute send or event creation via "run_script". All writes must go through the user-approved "draft_email" and "draft_calendar_event" cards.`;

  const result = await streamText({
    model,
    system: systemPrompt,
    messages: [{ 
      role: 'user', 
      content: 'i want to send a mail to priyanshu82711@gmail.com that i dont want to come to your stupic meeting tommoroow i m setting schdule to 26june' 
    }],
    tools: aiTools,
    stopWhen: stepCountIs(10)
  });

  console.log('Stream response:');
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  
  const steps = await result.steps;
  console.log('\nSteps run:', steps.length);
  for (const step of steps) {
    console.log('  Tool calls:', JSON.stringify(step.toolCalls));
  }
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error in main:', err.stack || err);
});
