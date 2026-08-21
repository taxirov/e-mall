"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatTime } from "@/lib/format";

export type Notification = { id: string; text: string; time: string; read: boolean };

type NotificationsValue = {
  notifications: Notification[];
  unread: number;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

function describeEvent(event: string, payload: unknown, role: string): string | null {
  if (event === "store:new" && role === "SUPER_ADMIN") {
    const data = payload as { name: string };
    return `Yangi do'kon ro'yxatdan o'tdi: ${data.name}`;
  }
  if (event === "sale:new" && (role === "OWNER" || role === "SELLER")) {
    const data = payload as { receiptNumber: string; total: string };
    return `Yangi sotuv: ${data.receiptNumber} — ${formatSom(data.total)} so'm`;
  }
  if (event === "order:new" && role === "OWNER") {
    const data = payload as { total: string };
    return `Yangi onlayn buyurtma — ${formatSom(data.total)} so'm`;
  }
  if (event === "product-request:new" && role === "SUPER_ADMIN") {
    const data = payload as { productName: string };
    return `Yangi tahrirlash so'rovi: ${data.productName}`;
  }
  if (event === "product-request:reviewed" && (role === "OWNER" || role === "SELLER")) {
    const data = payload as { decision: "APPROVED" | "REJECTED" };
    return data.decision === "APPROVED" ? "Tahrirlash so'rovingiz tasdiqlandi" : "Tahrirlash so'rovingiz rad etildi";
  }
  return null;
}

/**
 * Owns the realtime subscription and notification history for the whole
 * dashboard — mounted once at the layout level so history survives
 * navigating between the bell dropdown and the full /dashboard/notifications
 * page. History is session-only (not persisted to the database).
 */
export function NotificationsProvider({ role, children }: { role: string; children: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useRealtime((event, payload) => {
    const text = describeEvent(event, payload, role);
    if (!text) return;

    toast.info(text);
    setNotifications((prev) =>
      [{ id: `${Date.now()}-${Math.random()}`, text, time: formatTime(new Date()), read: false }, ...prev].slice(0, 50)
    );
    setUnread((prev) => prev + 1);
    router.refresh();
  });

  function markAllRead() {
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unread, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
