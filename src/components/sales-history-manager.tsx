"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptDialog } from "@/components/receipt-dialog";
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
  items: { name: string; qty: number; price: string }[];
};

const PAYMENT_LABEL: Record<string, string> = { CASH: "Naqd", CARD: "Karta" };

export function SalesHistoryManager({ storeName, sales }: { storeName: string; sales: SaleRow[] }) {
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

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
      <div>
        <h1 className="text-xl font-semibold">Savdolar tarixi</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} ta chek · {formatSom(totalSum)} so&apos;m
        </p>
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
              <Badge variant="secondary" className="gap-1">
                {sale.paymentMethod === "CASH" ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
                {PAYMENT_LABEL[sale.paymentMethod]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm text-muted-foreground">
                {sale.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.qty} — {formatSom(Number(item.price) * item.qty)} so&apos;m
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatSom(sale.total)} so&apos;m</span>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => viewReceipt(sale)}>
                  <ReceiptIcon className="size-3.5" />
                  Chekni ko&apos;rish
                </Button>
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
    </div>
  );
}
