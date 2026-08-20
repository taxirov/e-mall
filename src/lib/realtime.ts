import jwt from "jsonwebtoken";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";
const JWT_SECRET = process.env.REALTIME_JWT_SECRET as string;
const API_KEY = process.env.REALTIME_API_KEY as string;

export const ADMIN_ROOM = "admin";
export const storeRoom = (storeId: string) => `store:${storeId}`;

/** Mints a short-lived token the browser uses to authenticate its Socket.IO connection. */
export function createRealtimeToken(params: { room: string; userId: string; role: string }) {
  return jwt.sign(params, JWT_SECRET, { expiresIn: "1h" });
}

/** Broadcasts an event to everyone connected to a room (called after DB writes). */
export async function broadcastToRoom(room: string, event: string, payload?: unknown) {
  try {
    await fetch(`${REALTIME_URL}/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ room, event, payload }),
    });
  } catch {
    // Realtime is a non-critical enhancement — never fail the calling mutation because of it.
  }
}

export function broadcastToStore(storeId: string, event: string, payload?: unknown) {
  return broadcastToRoom(storeRoom(storeId), event, payload);
}

/** Notifies every connected Super Admin (e.g. a new store just registered). */
export function broadcastToAdmins(event: string, payload?: unknown) {
  return broadcastToRoom(ADMIN_ROOM, event, payload);
}
