import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsair } from "@/lib/corsair";
import { syncGmailCache, syncCalendarCache } from "@/lib/sync";
import { broadcast } from "@/lib/sse";
import { prisma } from "@/lib/db";

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

  const tenantId = resolvedTenantId || "I25kX3T0e7bqUybWxvYvzhAW4R8NFO9F";

  console.info(`Webhook received for tenant: "${tenantId}", processing...`);


  const result = await processWebhook(corsair, headers, body, {
    tenantId,
  });

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
