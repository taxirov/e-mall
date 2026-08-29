"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtime } from "@/hooks/use-realtime";
import { useEffect, useState } from "react";
import { formatSom, formatDateTime } from "@/lib/format";

type Order = {
  id: string;
  status: string;
  total: string;
  address: string | null;
  phone: string | null;
  note: string | null;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  courierStatus: string | null;
  courierName: string | null;
  courierPhone: string | null;
  items: { name: string; qty: number; price: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Yangi",
  CONFIRMED: "Tasdiqlangan",
  SHIPPED: "Jo'natilgan",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor qilingan",
};
const STATUSES = Object.keys(STATUS_LABEL);

const COURIER_STATUS_LABEL: Record<string, string> = {
  searching: "Kuryer qidirilmoqda",
  assigned: "Kuryer topildi",
  picked_up: "Kuryer yo'lda",
  delivered: "Yetkazildi",
};

export function OrderManager({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hasNew, setHasNew] = useState(false);

  useRealtime((event) => {
    if (event === "order:new") setHasNew(true);
  });

  useEffect(() => {
    if (hasNew) router.refresh();
  }, [hasNew, router]);

  function handleStatusChange(orderId: string, status: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status as never);
      if (result.ok) {
        toast.success("Buyurtma holati yangilandi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Buyurtmalar</h1>

      <div className="grid gap-3">
        {initialOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  {order.customerName} · {order.customerPhone}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)} · {order.address}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant={order.status === "CANCELLED" ? "destructive" : order.status === "DELIVERED" ? "default" : "secondary"}>
                  {STATUS_LABEL[order.status]}
                </Badge>
                {order.courierStatus && (
                  <Badge variant="outline" className="text-xs">
                    {COURIER_STATUS_LABEL[order.courierStatus] ?? order.courierStatus}
                    {order.courierName ? ` — ${order.courierName}` : ""}
                    {order.courierPhone ? ` (${order.courierPhone})` : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.qty} — {formatSom(Number(item.price) * item.qty)} so&apos;m
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatSom(order.total)} so&apos;m</span>
                <Select
                  defaultValue={order.status}
                  disabled={pending}
                  onValueChange={(value) => value && handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {initialOrders.length === 0 && <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo&apos;q.</p>}
      </div>
    </div>
  );
}
