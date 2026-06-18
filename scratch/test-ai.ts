import { generateText, stepCountIs } from 'ai';
import { getGoogleModel } from '../lib/ai';
import { getCorsairAiTools } from '../lib/ai-tools';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const tenantId = 'I25kX3T0e7bqUybWxvYvzhAW4R8NFO9F';
  const tools = getCorsairAiTools(tenantId);
  console.log('Available Corsair tools:', Object.keys(tools));
  
  console.log('Querying Gemini model with prompt and stopWhen constraint...');
  const model = await getGoogleModel();
  const result = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    prompt: 'Check the gmail tools. What are their names and description?',
  });
  
  console.log('Steps executed:', result.steps.length);
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    console.log(`Step ${i + 1} - tool calls:`, step.toolCalls?.map(t => t.toolName) || []);
    console.log(`Step ${i + 1} - text:`, step.text);
  }
  console.log('\nGemini final response:', result.text);
}

main().catch(console.error);
