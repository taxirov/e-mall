"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { createReturn } from "@/actions/returns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatSom } from "@/lib/format";

type ReturnableItem = { saleItemId: string; name: string; qty: number; price: number; returnedQty: number };

export function ReturnDialog({
  saleId,
  items,
  open,
  onOpenChange,
}: {
  saleId: string;
  items: ReturnableItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});

  const amount = items.reduce((sum, item) => sum + (qtyByItem[item.saleItemId] ?? 0) * item.price, 0);
  const returnableItems = items.filter((item) => item.qty - item.returnedQty > 0);

  function setQty(saleItemId: string, qty: number, max: number) {
    setQtyByItem((prev) => ({ ...prev, [saleItemId]: Math.max(0, Math.min(max, qty)) }));
  }

  function handleSubmit() {
    const payload = Object.entries(qtyByItem)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, qty]) => ({ saleItemId, qty }));
    if (payload.length === 0) {
      toast.error("Qaytarish uchun miqdor kiriting");
      return;
    }
    startTransition(async () => {
      const result = await createReturn(saleId, payload);
      if (result.ok) {
        toast.success(`Qaytarildi: ${formatSom(result.data.amount)} so'm`);
        onOpenChange(false);
        setQtyByItem({});
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQtyByItem({});
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mahsulotni qaytarish</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {returnableItems.map((item) => {
            const remaining = item.qty - item.returnedQty;
            const qty = qtyByItem[item.saleItemId] ?? 0;
            return (
              <div key={item.saleItemId} className="flex items-center justify-between gap-2 border-b pb-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSom(item.price)} so&apos;m · sotilgan: {item.qty}
                    {item.returnedQty > 0 && `, avval qaytarilgan: ${item.returnedQty}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-7" onClick={() => setQty(item.saleItemId, qty - 1, remaining)}>
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{qty}</span>
                  <Button size="icon" variant="outline" className="size-7" onClick={() => setQty(item.saleItemId, qty + 1, remaining)}>
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {returnableItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Ushbu sotuvdagi barcha mahsulotlar allaqachon qaytarilgan.</p>
          )}
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Qaytariladigan summa</span>
          <span>{formatSom(amount)} so&apos;m</span>
        </div>
        <DialogFooter>
          <Button className="w-full" disabled={amount === 0 || pending} onClick={handleSubmit}>
            {pending ? "Qaytarilmoqda..." : "Qaytarish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
