import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "./db";

// Force IPv4 DNS resolution - IPv6 is broken on some local mac configurations
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const kek = process.env.CORSAIR_KEK || "dummy_kek_12345678901234567890123456789012";
if (!process.env.CORSAIR_KEK) {
  console.warn("⚠️ CORSAIR_KEK is not defined. Using dummy KEK to pass build.");
}

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool,
  kek: kek,
  multiTenancy: true,
});
