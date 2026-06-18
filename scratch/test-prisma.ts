import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("Querying database using Prisma...");
    const users = await prisma.user.findMany({
      take: 5,
    });
    console.log("Database connection successful!");
    console.log("Users count:", users.length);
    console.log("Users:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
