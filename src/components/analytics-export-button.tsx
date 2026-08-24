"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type SummaryRow = { label: string; value: string | number };
type StoreRow = { name: string; revenue: number };

function toCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function AnalyticsExportButton({ summary, topStores }: { summary: SummaryRow[]; topStores: StoreRow[] }) {
  function handleExport() {
    const lines: string[] = ["Ko'rsatkich,Qiymat"];
    for (const row of summary) lines.push([toCsvCell(row.label), toCsvCell(row.value)].join(","));
    lines.push("");
    lines.push("Do'kon,Bugungi daromad");
    for (const s of topStores) lines.push([toCsvCell(s.name), toCsvCell(s.revenue)].join(","));

    const csv = lines.join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analitika-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download className="size-3.5" />
      CSV yuklab olish
    </Button>
  );
}
