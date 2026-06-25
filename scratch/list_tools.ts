import { getCorsairAiTools } from '../lib/ai-tools';
import dotenv from 'dotenv';
dotenv.config();

const tenantId = 'test-tenant';
const tools = getCorsairAiTools(tenantId);
console.log("Registered Tools:");
for (const [name, tool] of Object.entries(tools)) {
  console.log(`- ${name}: ${tool.description}`);
}
