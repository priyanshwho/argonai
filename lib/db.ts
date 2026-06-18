import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import pg from "pg";

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not defined");

export const pool = globalForDb.pool ?? new pg.Pool({
  connectionString: url,
  keepAlive: true,
  idleTimeoutMillis: 15_000,
  connectionTimeoutMillis: 10_000,
  max: 10,
});

pool.on("error", (err: Error) => {
  console.error("Database pg pool error:", err);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = globalForDb.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}

