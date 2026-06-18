import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("Fetching Corsair Integrations from database...");
    const integrations = await prisma.corsairIntegration.findMany();
    console.log("Found integrations:", integrations.length);
    for (const integration of integrations) {
      console.log(`\nIntegration: ${integration.name} (${integration.id})`);
      console.log("Config:", JSON.stringify(integration.config, null, 2));
    }
  } catch (err) {
    console.error("Error fetching integrations:", err);
  } finally {
    process.exit(0);
  }
}

main();
