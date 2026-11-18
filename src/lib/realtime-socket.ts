import { io, type Socket } from "socket.io-client";
import { baseUrl } from "@/utils/baseUrl";

let socket: Socket | null = null;
let activeToken = "";

export function socketOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (raw) {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    return withProtocol.replace(/\/+$/, "");
  }
  return baseUrl.replace(/\/api\/v\d+$/i, "").replace(/\/+$/, "");
}

export function userIdFromAccessToken(token: string): string {
  try {
    const segment = token.split(".")[1];
    if (!segment) return "";
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(padded)) as { id?: string; _id?: string; userId?: string };
    return String(json.id || json._id || json.userId || "");
  } catch {
    return "";
  }
}

export function connectRealtimeSocket(token: string): Socket {
  if (socket && activeToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeToken = token;
  socket = io(socketOrigin(), {
    transports: ["websocket", "polling"],
    auth: { token },
    query: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });
  return socket;
}

export function disconnectRealtimeSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  activeToken = "";
}
