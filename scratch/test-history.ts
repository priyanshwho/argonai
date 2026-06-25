import { prisma } from '../lib/db';
import { getGoogleModel } from '../lib/ai';
import { getCorsairAiTools } from '../lib/ai-tools';
import { streamText, hasToolCall } from 'ai';
import { z } from 'zod';

function getMessageText(message: any): string {
  if (typeof message.content === 'string' && message.content) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  return message.content || '';
}

function convertClientMessagesToModelMessages(messages: any[]): any[] {
  const modelMessages: any[] = [];

  for (const m of messages || []) {
    if (m.role === 'user') {
      if (Array.isArray(m.parts) && m.parts.length > 0) {
        const parts = m.parts.map((p: any) => {
          if (p.type === 'text') {
            return { type: 'text', text: p.text };
          } else if (p.type === 'file') {
            const dataBase64 = p.url.includes(',') ? p.url.split(',')[1] : p.url;
            return {
              type: 'file',
              data: dataBase64,
              mimeType: p.mediaType || 'application/octet-stream'
            };
          }
          return p;
        });
        modelMessages.push({ role: 'user', content: parts });
      } else {
        modelMessages.push({ role: 'user', content: getMessageText(m) });
      }
    } else if (m.role === 'system') {
      modelMessages.push({ role: 'system', content: getMessageText(m) });
    } else if (m.role === 'assistant') {
      const toolParts = Array.isArray(m.parts)
        ? m.parts.filter((p: any) => typeof p.type === 'string' && p.type.startsWith('tool-'))
        : [];
      
      const resolvedParts = toolParts.filter(
        (p: any) => p.state === 'output-available' || p.state === 'output-error'
      );

      const legacyInvocations = (m.toolInvocations || []).filter(
        (t: any) => t.state === 'result' || t.result !== undefined
      );

      const hasCalls = resolvedParts.length > 0 || legacyInvocations.length > 0;

      if (!hasCalls) {
        modelMessages.push({ role: 'assistant', content: getMessageText(m) });
      } else {
        const assistantContent: any[] = [];
        const contentText = getMessageText(m);
        if (contentText) {
          assistantContent.push({ type: 'text', text: contentText });
        }

        for (const part of resolvedParts) {
          const toolName = part.type.replace(/^tool-/, '');
          assistantContent.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName,
            input: part.input ?? {}
          });
        }

        for (const call of legacyInvocations) {
          assistantContent.push({
            type: 'tool-call',
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            input: call.args ?? {}
          });
        }

        modelMessages.push({ role: 'assistant', content: assistantContent });

        const toolResultContent: any[] = [];

        for (const part of resolvedParts) {
          const toolName = part.type.replace(/^tool-/, '');
          const rawResult = part.output ?? part.errorText ?? {};
          const isError = part.state === 'output-error';
          
          let outputVal: any;
          if (typeof rawResult === 'string') {
            outputVal = { type: isError ? 'error-text' : 'text', value: rawResult };
          } else {
            outputVal = { type: isError ? 'error-json' : 'json', value: rawResult };
          }

          toolResultContent.push({
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName,
            output: outputVal
          });
        }
        for (const t of legacyInvocations) {
          const rawResult = t.result ?? {};
          
          let outputVal: any;
          if (typeof rawResult === 'string') {
            outputVal = { type: 'text', value: rawResult };
          } else {
            outputVal = { type: 'json', value: rawResult };
          }

          toolResultContent.push({
            type: 'tool-result',
            toolCallId: t.toolCallId,
            toolName: t.toolName,
            output: outputVal
          });
        }

        if (toolResultContent.length > 0) {
          modelMessages.push({ role: 'tool', content: toolResultContent });
        }
      }
    }
  }

  return modelMessages;
}

async function main() {
  const account = await prisma.corsairAccount.findFirst();
  if (!account) {
    console.error('No account found in DB!');
    return;
  }

  const rawAiTools = getCorsairAiTools(account.tenantId);
  const aiTools = {
    ...rawAiTools,
    draft_email: {
      description: 'draft_email description',
      inputSchema: z.object({ to: z.string(), subject: z.string(), body: z.string(), threadId: z.string().optional() }),
      execute: async (args: any) => args
    },
    draft_calendar_event: {
      description: 'draft_calendar_event description',
      inputSchema: z.object({ title: z.string(), startTime: z.string(), endTime: z.string(), attendees: z.array(z.string()).optional() }),
      execute: async (args: any) => args
    }
  };

  const model = await getGoogleModel();

  const clientMessages = [
    {
      id: "msg-1",
      role: "user" as const,
      content: "Send a mail to priyanshu82711@gmail.com that we have a project discussion meeting on next Sunday"
    },
    {
      id: "msg-2",
      role: "assistant" as const,
      content: "",
      parts: [
        {
          type: "tool-draft_email",
          toolCallId: "call-12345",
          input: {
            to: "priyanshu82711@gmail.com",
            subject: "Project Discussion Meeting",
            body: "Hi Priyanshu, I'm writing to confirm that we have a project discussion meeting scheduled for next Sunday."
          },
          state: "output-available",
          output: {
            success: true,
            message: "Email sent successfully"
          }
        }
      ]
    },
    {
      id: "msg-3",
      role: "user" as const,
      content: "after 1 mail you dont do any thing?"
    }
  ];

  console.log('Converting client messages to model messages...');
  const modelMessages = convertClientMessagesToModelMessages(clientMessages);
  console.log('Converted model messages:', JSON.stringify(modelMessages, null, 2));

  console.log('Calling streamText...');
  try {
    const result = await streamText({
      model,
      system: 'You are ArgonAI. Help the user.',
      messages: modelMessages,
      tools: aiTools,
      stopWhen: [
        hasToolCall('draft_email'),
        hasToolCall('draft_calendar_event'),
      ]
    });

    console.log('Response text:');
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\nSteps:');
    const steps = await result.steps;
    console.log('Total steps run:', steps.length);
  } catch (err: any) {
    console.error('Error calling streamText:', err);
  }
}

main().catch(console.error);
