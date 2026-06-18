import { createBaseMcpServer } from '@corsair-dev/mcp';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { corsair } from '@/lib/corsair';
import { auth } from '@/lib/auth';
import crypto from 'node:crypto';

// Global sessions map to persist across hot reloads in dev mode
const globalForMcp = globalThis as unknown as {
  mcpSessions: Map<string, {
    server: any;
    transport: WebStandardStreamableHTTPServerTransport;
  }> | undefined;
};

const sessions = globalForMcp.mcpSessions ?? new Map();
if (process.env.NODE_ENV !== "production") {
  globalForMcp.mcpSessions = sessions;
}

async function cleanup(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      await session.transport.close();
    } catch (e) {
      console.error("Error closing transport:", e);
    }
    try {
      await session.server.close();
    } catch (e) {
      console.error("Error closing server:", e);
    }
    sessions.delete(sessionId);
  }
}

export async function POST(req: Request) {
  const sessionId = req.headers.get("mcp-session-id");
  
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return new Response("Session not found", { status: 404 });
    }
    return session.transport.handleRequest(req);
  }

  // Initialization request (no session ID)
  // Resolve tenant ID
  const sessionData = await auth.api.getSession({
    headers: req.headers,
  });

  const url = new URL(req.url);
  const tenantId = sessionData?.user?.id || 
                   url.searchParams.get("tenant_id") || 
                   url.searchParams.get("tenantid") || 
                   req.headers.get("x-tenant-id") || 
                   "I25kX3T0e7bqUybWxvYvzhAW4R8NFO9F";

  const server = createBaseMcpServer({ corsair, tenantId });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { server, transport });
    },
    onsessionclosed: (id) => {
      cleanup(id);
    }
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = req.headers.get("mcp-session-id") || url.searchParams.get("mcp-session-id") || url.searchParams.get("sessionId");
  if (!sessionId || !sessions.has(sessionId)) {
    return new Response("Missing or invalid mcp-session-id", { status: 400 });
  }

  const session = sessions.get(sessionId)!;
  return session.transport.handleRequest(req);
}

export async function DELETE(req: Request) {
  const sessionId = req.headers.get("mcp-session-id");
  if (sessionId) {
    await cleanup(sessionId);
  }
  return new Response("OK", { status: 200 });
}
