// Server-Sent Events (SSE) Global Broadcast Manager for Live Sync
export type BroadcastMessage = {
  type: "refresh" | "connected";
  plugin?: "gmail" | "googlecalendar";
  tenantId: string;
};

type ClientCallback = (message: BroadcastMessage) => void;

const globalForSSE = globalThis as unknown as {
  clients: Set<ClientCallback> | undefined;
};

export const clients = globalForSSE.clients ?? new Set<ClientCallback>();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.clients = clients;
}

export function registerClient(callback: ClientCallback) {
  clients.add(callback);
  return () => {
    clients.delete(callback);
  };
}

export function broadcast(message: BroadcastMessage) {
  clients.forEach((callback) => {
    try {
      callback(message);
    } catch (err) {
      console.error("Error sending SSE to client:", err);
    }
  });
}
