"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatTime } from "@/lib/format";

type FeedEntry = { id: string; text: string; time: string };

export function OwnerLiveFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);

  const { connected } = useRealtime((event, payload) => {
    const time = formatTime(new Date());

    if (event === "sale:new") {
      const data = payload as { receiptNumber: string; total: string };
      setEntries((prev) => [{ id: `${Date.now()}`, text: `Yangi sotuv: ${data.receiptNumber} — ${formatSom(data.total)} so'm`, time }, ...prev].slice(0, 20));
    } else if (event === "order:new") {
      const data = payload as { orderId: string; total: string };
      setEntries((prev) => [{ id: `${Date.now()}`, text: `Yangi onlayn buyurtma — ${formatSom(data.total)} so'm`, time }, ...prev].slice(0, 20));
    }
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Jonli oqim</CardTitle>
        <Badge variant={connected ? "default" : "secondary"} className="text-xs">
          {connected ? "Ulangan" : "Ulanmoqda..."}
        </Badge>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hozircha yangi hodisalar yo&apos;q.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map((entry) => (
              <li key={entry.id} className="flex justify-between border-b pb-1 last:border-0">
                <span>{entry.text}</span>
                <span className="text-xs text-muted-foreground">{entry.time}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
