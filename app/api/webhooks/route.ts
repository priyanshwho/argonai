import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsair } from "@/lib/corsair";
import { syncGmailCache, syncCalendarCache } from "@/lib/sync";
import { broadcast } from "@/lib/sse";
import { prisma } from "@/lib/db";

// ── Rate-limit cooldown guard ──────────────────────────────────────────
// The corsair library logs 429 errors internally without throwing them,
// which means every incoming Pub/Sub webhook still triggers a full
// processWebhook → Gmail API call → 429 cycle.  To break this loop we
// track the last time we saw a 429 for each tenant and silently skip
// processing until the cooldown expires.
const rateLimitCooldowns = new Map<string, number>(); // tenantId → cooldown-until epoch ms
const COOLDOWN_MS = 60_000; // 60 seconds default cooldown

// Intercept console.error to detect corsair's internal 429 logging
const originalConsoleError = console.error;
let lastDetected429Tenant: string | null = null;

console.error = (...args: any[]) => {
  const msg = args.map(String).join(" ");
  if (msg.includes("Too Many Requests") || msg.includes("429")) {
    // Mark that the most recent webhook processing hit a rate limit
    if (lastDetected429Tenant) {
      rateLimitCooldowns.set(lastDetected429Tenant, Date.now() + COOLDOWN_MS);
    }
  }
  originalConsoleError.apply(console, args);
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const contentType = request.headers.get("content-type");
  let body: string | Record<string, unknown> = {};

  try {
    const text = await request.text();
    if (contentType?.includes("application/json")) {
      body = text && text.trim() ? JSON.parse(text) : {};
    } else {
      body = text && text.trim() ? text : {};
    }
  } catch (err) {
    console.error("Failed to parse request body in webhook route:", err);
    body = {};
  }

  // Get tenant ID from query parameter or decode Pub/Sub payload to match user email dynamically
  let resolvedTenantId =
    url.searchParams.get("tenant_id") ||
    url.searchParams.get("tenantid") ||
    null;

  if (!resolvedTenantId && body && typeof body === "object") {
    const pubsubMsg = (body as any).message;
    if (pubsubMsg?.data) {
      try {
        const dataStr = Buffer.from(pubsubMsg.data, "base64").toString("utf-8");
        const parsed = JSON.parse(dataStr);
        let email: string | undefined = parsed.emailAddress;

        if (!email && parsed.resourceUri) {
          const match = parsed.resourceUri.match(/\/calendars\/([^/]+)/);
          if (match && match[1] && match[1] !== "primary") {
            email = decodeURIComponent(match[1]);
          }
        }

        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
          });
          if (dbUser) {
            resolvedTenantId = dbUser.id;
          }
        }
      } catch (err) {
        console.warn("Failed to decode Pub/Sub data in webhook route:", err);
      }
    }
  }

  if (!resolvedTenantId) {
    console.warn("Webhook received but no tenant ID could be resolved. Skipping processing to prevent account mismatch.");
    return new Response("No resolved tenant ID", { status: 200 });
  }

  const tenantId = resolvedTenantId;

  // ── Cooldown check: skip processing if we recently hit a rate limit ──
  const cooldownUntil = rateLimitCooldowns.get(tenantId);
  if (cooldownUntil && Date.now() < cooldownUntil) {
    // Silently acknowledge the webhook without calling processWebhook
    return NextResponse.json(
      { success: true, skipped: true, reason: "Rate-limit cooldown active" },
      { status: 200 }
    );
  }

  // Prune webhook event logs older than 48 hours to prevent database storage bloat (non-blocking background query)
  const pruneCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  prisma.corsairEvent.deleteMany({
    where: {
      createdAt: { lt: pruneCutoff }
    }
  }).catch(err => {
    console.error("Failed to prune old CorsairEvent records:", err);
  });

  console.info(`Webhook received for tenant: "${tenantId}", processing...`);

  // Set the tenant context so the console.error interceptor knows which tenant hit a 429
  lastDetected429Tenant = tenantId;

  let result;
  try {
    result = await processWebhook(corsair, headers, body, {
      tenantId,
    });
  } catch (err: any) {
    // Check if it's a rate limit error (429)
    const isRateLimit =
      err.status === 429 ||
      err.statusCode === 429 ||
      String(err).includes("429") ||
      String(err).includes("Too Many Requests");

    if (isRateLimit) {
      rateLimitCooldowns.set(tenantId, Date.now() + COOLDOWN_MS);
    }

    // Always return 200 to acknowledge the Pub/Sub message and prevent retries
    return NextResponse.json(
      { success: false, error: "Webhook processing failed, acknowledged" },
      { status: 200 }
    );
  } finally {
    lastDetected429Tenant = null;
  }

  console.info(
    "Plugin Processed:",
    result.plugin,
    result.action
  );

  // Sync to database caches if processing succeeded
  if (result.plugin === "gmail") {
    // Sync newly cached messages
    await syncGmailCache(tenantId);
    // Broadcast live refresh to SSE clients
    broadcast({ type: "refresh", plugin: "gmail", tenantId });
  } else if (result.plugin === "googlecalendar") {
    // Sync newly cached calendar events
    await syncCalendarCache(tenantId);
    // Broadcast live refresh to SSE clients
    broadcast({ type: "refresh", plugin: "googlecalendar", tenantId });
  }

  const responseHeaders = result.responseHeaders;
  const nextHeaders = new Headers();

  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, value);
    }
  }

  if (!result.response) {
    return NextResponse.json(
      {
        success: false,
        message: "No matching webhook handler found",
      },
      { status: 404 }
    );
  }

  if (result.response !== undefined) {
    return NextResponse.json(result.response, {
      headers: nextHeaders,
    });
  }

  return new NextResponse(null, {
    status: 200,
    headers: nextHeaders,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Atria webhook listener is active",
    timestamp: new Date().toISOString(),
  });
}
