"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Receipt as ReceiptIcon, Undo2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { ReturnDialog } from "@/components/return-dialog";
import type { ReceiptData } from "@/actions/pos";
import { formatSom, formatDateTime } from "@/lib/format";

type SaleRow = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  paymentMethod: "CASH" | "CARD";
  cashierName: string;
  total: string;
  discountAmount: string;
  couponCode: string | null;
  returnedAmount: number;
  items: { saleItemId: string; name: string; qty: number; price: string; returnedQty: number }[];
};

const PAYMENT_LABEL: Record<string, string> = { CASH: "Naqd", CARD: "Karta" };

function exportCsv(sales: SaleRow[]) {
  const header = ["Chek raqami", "Sana", "Kassir", "To'lov turi", "Jami", "Chegirma", "Kupon", "Qaytarilgan"];
  const rows = sales.map((s) => [
    s.receiptNumber,
    formatDateTime(s.createdAt),
    s.cashierName,
    PAYMENT_LABEL[s.paymentMethod],
    s.total,
    s.discountAmount,
    s.couponCode ?? "",
    s.returnedAmount.toString(),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `savdolar-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SalesHistoryManager({
  storeName,
  sales,
  initialFrom,
  initialTo,
}: {
  storeName: string;
  sales: SaleRow[];
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<SaleRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.receiptNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [sales, search]);

  const totalSum = filtered.reduce((sum, s) => sum + Number(s.total), 0);

  function applyDateRange() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/dashboard/owner/sales${params.toString() ? `?${params}` : ""}`);
  }

  function viewReceipt(sale: SaleRow) {
    const total = Number(sale.total);
    const discountAmount = Number(sale.discountAmount);
    setReceipt({
      receiptNumber: sale.receiptNumber,
      storeName,
      cashierName: sale.cashierName,
      createdAt: sale.createdAt,
      paymentMethod: sale.paymentMethod,
      items: sale.items.map((item) => ({ name: item.name, qty: item.qty, price: Number(item.price) })),
      subtotal: total + discountAmount,
      discountAmount,
      couponCode: sale.couponCode,
      total,
    });
    setReceiptOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Savdolar tarixi</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} ta chek · {formatSom(totalSum)} so&apos;m
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
          <Download className="size-3.5" />
          CSV yuklab olish
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="from" className="text-xs">
            Sanadan
          </Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to" className="text-xs">
            Sanagacha
          </Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={applyDateRange}>
          Filtrlash
        </Button>
        {(from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setTo("");
              router.push("/dashboard/owner/sales");
            }}
          >
            Tozalash
          </Button>
        )}
      </div>

      <Input
        placeholder="Chek raqami, kassir yoki mahsulot bo'yicha qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid gap-3">
        {filtered.map((sale) => (
          <Card key={sale.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{sale.receiptNumber}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(sale.createdAt)} · {sale.cashierName}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {sale.returnedAmount > 0 && (
                  <Badge variant="outline" className="gap-1 text-destructive">
                    Qaytarilgan: {formatSom(sale.returnedAmount)} so&apos;m
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  {sale.paymentMethod === "CASH" ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
                  {PAYMENT_LABEL[sale.paymentMethod]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground">
                {sale.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.qty} — {formatSom(Number(item.price) * item.qty)} so&apos;m
                    {item.returnedQty > 0 && ` (qaytarilgan: ${item.returnedQty})`}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{formatSom(sale.total)} so&apos;m</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setReturnTarget(sale)}>
                    <Undo2 className="size-3.5" />
                    Qaytarish
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => viewReceipt(sale)}>
                    <ReceiptIcon className="size-3.5" />
                    Chekni ko&apos;rish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {sales.length === 0 ? "Hozircha savdolar yo'q." : "Hech narsa topilmadi."}
          </p>
        )}
      </div>

      <ReceiptDialog receipt={receipt} open={receiptOpen} onOpenChange={setReceiptOpen} />
      {returnTarget && (
        <ReturnDialog
          saleId={returnTarget.id}
          items={returnTarget.items.map((item) => ({
            saleItemId: item.saleItemId,
            name: item.name,
            qty: item.qty,
            price: Number(item.price),
            returnedQty: item.returnedQty,
          }))}
          open={!!returnTarget}
          onOpenChange={(open) => !open && setReturnTarget(null)}
        />
      )}
    </div>
  );
}
