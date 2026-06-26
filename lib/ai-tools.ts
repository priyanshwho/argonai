import { tool } from 'ai';
import { z } from 'zod';
import { buildCorsairToolDefs } from '@corsair-dev/mcp';
import { corsair } from './corsair';
import { prisma } from './db';

export function getCorsairAiTools(tenantId: string) {
  const mcpTools = buildCorsairToolDefs({ corsair: corsair.withTenant(tenantId) as any, tenantId });
  const aiTools: Record<string, any> = {};

  for (const mcpTool of mcpTools) {
    aiTools[mcpTool.name] = tool({
      description: mcpTool.description,
      inputSchema: z.object(mcpTool.shape),
      execute: async (args: any) => {
        if (mcpTool.name === 'events.delete') {
          // Custom override to handle 404 gracefully and clear DB
          const tenantClient = corsair.withTenant(tenantId);
          try {
            await tenantClient.googlecalendar.api.events.delete({
              calendarId: args.calendarId || 'primary',
              id: args.id,
            });
          } catch (e: any) {
            console.warn("AI events.delete error:", e);
            // Ignore 404 or 403 (could be already deleted or read-only)
          }

          // Clear local cache
          const corsairAccount = await prisma.corsairAccount.findFirst({
            where: { tenantId, integrationId: 'googlecalendar' },
          });
          if (corsairAccount) {
            await prisma.corsairEntity.deleteMany({
              where: { accountId: corsairAccount.id, entityId: args.id },
            });
          }
          return { success: true, message: "Event deleted successfully." };
        }

        const result = await mcpTool.handler(args);
        const textItems = result.content?.filter((c: any) => c.type === 'text') || [];
        if (result.isError) {
          throw new Error(textItems.map((c: any) => c.text).join('\n'));
        }
        
        // Try to parse as JSON if it's a JSON string, else return text
        const text = textItems.map((c: any) => c.text).join('\n');
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      },
    });
  }

  return aiTools;
}
