import { NextRequest } from "next/server";
import { registerClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant_id") || "dev";

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (msg: { type: string; tenantId: string; plugin?: string }) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
    } catch (err) {
      console.error("Error writing to stream:", err);
    }
  };

  const unregister = registerClient((message) => {
    if (message.tenantId === tenantId) {
      sendEvent(message);
    }
  });

  // Keep connection alive with simple heartbeat
  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch (err) {
      // Ignored - closed streams will abort
    }
  }, 15000);

  // Clean up resources on connection drop
  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    unregister();
    try {
      writer.close();
    } catch (e) {
      // Ignore
    }
  });

  // Send initial success connection packet
  sendEvent({ type: "connected", tenantId });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
