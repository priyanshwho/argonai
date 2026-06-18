import { tool } from 'ai';
import { z } from 'zod';
import { buildCorsairToolDefs } from '@corsair-dev/mcp';
import { corsair } from './corsair';

export function getCorsairAiTools(tenantId: string) {
  const mcpTools = buildCorsairToolDefs({ corsair, tenantId });
  const aiTools: Record<string, any> = {};

  for (const mcpTool of mcpTools) {
    aiTools[mcpTool.name] = tool({
      description: mcpTool.description,
      inputSchema: z.object(mcpTool.shape),
      execute: async (args: any) => {
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
