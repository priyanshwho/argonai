const { getCorsairAiTools } = require('../lib/ai-tools');
const { createCorsair } = require('corsair');
const { gmail } = require('@corsair-dev/gmail');
const { googlecalendar } = require('@corsair-dev/googlecalendar');
const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const tenantId = 'test-tenant';
const tools = getCorsairAiTools(tenantId);
console.log("Registered Tools:");
for (const [name, tool] of Object.entries(tools)) {
  console.log(`- ${name}: ${tool.description}`);
}
