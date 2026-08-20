"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatTime } from "@/lib/format";

type Notification = { id: string; text: string; time: string };

/**
 * Mounted once in the dashboard layout (persists across page navigation),
 * so a Super Admin or store owner is notified of relevant events — a new
 * store registering, a sale, an order — no matter which page they're on,
 * and the current page's server data is refreshed to match.
 */
export function DashboardNotifications({ role }: { role: string }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  function describeEvent(event: string, payload: unknown): string | null {
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
    return null;
  }

  useRealtime((event, payload) => {
    const text = describeEvent(event, payload);
    if (!text) return;

    toast.info(text);
    setNotifications((prev) => [{ id: `${Date.now()}-${Math.random()}`, text, time: formatTime(new Date()) }, ...prev].slice(0, 20));
    setUnread((prev) => prev + 1);
    router.refresh();
  });

  return (
    <DropdownMenu onOpenChange={(open) => open && setUnread(0)}>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative" />}>
        <Bell className="size-4" />
        {unread > 0 && (
          <Badge className="absolute -top-1.5 -right-1.5 size-4 justify-center rounded-full p-0 text-[10px]">
            {unread > 9 ? "9+" : unread}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Bildirishnomalar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Hozircha bildirishnomalar yo&apos;q.</p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
              <span className="text-sm">{n.text}</span>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
