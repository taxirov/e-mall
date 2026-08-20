"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";

/**
 * Connects to the store's Socket.IO room and invokes `onEvent` for every
 * message received. Reconnects automatically; safe to call from multiple
 * components (each gets its own socket). Returns whether the socket is
 * currently connected.
 */
export function useRealtime(onEvent: (event: string, payload: unknown) => void) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket | undefined;
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/realtime-token");
      if (!res.ok || cancelled) return;
      const { token } = await res.json();
      if (cancelled) return;

      socket = io(REALTIME_URL, { auth: { token } });
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      for (const event of ["sale:new", "stock:update", "order:new"]) {
        socket.on(event, (payload) => onEventRef.current(event, payload));
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  return { connected };
}
