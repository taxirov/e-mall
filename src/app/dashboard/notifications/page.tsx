"use client";

import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/contexts/notifications-context";

export default function NotificationsPage() {
  const { notifications } = useNotifications();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bildirishnomalar</h1>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="size-8" />
          <p className="text-sm">Hozircha bildirishnomalar yo&apos;q</p>
          <p className="max-w-xs text-center text-xs">
            Bu ro&apos;yxat joriy seansda kelgan bildirishnomalarni ko&apos;rsatadi — sahifani qayta yuklasangiz tozalanadi.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {notifications.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
