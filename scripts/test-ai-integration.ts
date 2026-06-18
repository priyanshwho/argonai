import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { getCorsairAiTools } from "../lib/ai-tools";
import dns from "node:dns";

// Force IPv4 resolution to prevent local networking/DNS timeout issues
dns.setDefaultResultOrder("ipv4first");

async function runTestHarness() {
  console.log("=================================================");
  console.log("       ATRIA AI INTEGRATION TEST HARNESS        ");
  console.log("=================================================");

  // 1. Verify GOOGLE_GENERATIVE_AI_API_KEY
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment.");
    process.exit(1);
  }
  console.log("✓ Gemini API key detected.");

  // 2. Configure Gemini Model
  const model = google("gemini-3.1-flash-lite");

  // 3. Retrieve Corsair Tools for the active user session ID
  const tenantId = "tyDoX48xYCjXOtPGBhZ76isww2RtdQEP";
  console.log(`✓ Constructing Corsair AI tool definitions for tenant: ${tenantId}`);
  
  let tools;
  try {
    tools = getCorsairAiTools(tenantId);
    console.log(`✓ Mapped Corsair tools: [${Object.keys(tools).join(", ")}]`);
  } catch (err) {
    console.error("❌ ERROR mapping Corsair tool definitions:", err);
    process.exit(1);
  }

  // 4. Run generateText simulating a search prompt
  console.log("\n💬 Simulating AI search query prompt: 'List the subject line of my last 2 emails'...");
  
  try {
    const result = await generateText({
      model,
      system: "You are Atria, a helpful workspace assistant with access to Gmail and Google Calendar tools.",
      prompt: "List the subject line of my last 2 emails",
      tools,
      stopWhen: stepCountIs(5),
    });

    console.log("\n=================== RESULT ======================");
    console.log(`Steps Run: ${result.steps.length}`);
    
    // Log tool calls
    const toolCalls = result.steps.flatMap(s => s.toolCalls);
    if (toolCalls.length > 0) {
      console.log("\n🛠️ Tool Calls Made:");
      toolCalls.forEach((call, idx) => {
        console.log(`  ${idx + 1}. Tool: ${call.toolName}`);
        console.log(`     Arguments: ${JSON.stringify((call as { args?: unknown }).args)}`);
      });
    } else {
      console.log("\n⚠️ No tool calls were made by Gemini during this query.");
    }

    console.log("\n🤖 Assistant Response:");
    console.log(result.text);
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ ERROR executing AI text generation:", err);
    process.exit(1);
  }
}

runTestHarness().catch((err) => {
  console.error("❌ FATAL HARNESS FAILURE:", err);
  process.exit(1);
});
