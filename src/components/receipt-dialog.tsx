"use client";

import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptPreview } from "@/components/receipt-preview";
import type { ReceiptData } from "@/actions/pos";

export function ReceiptDialog({
  receipt,
  open,
  onOpenChange,
}: {
  receipt: ReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sotuv yakunlandi</DialogTitle>
        </DialogHeader>
        {receipt && (
          <div className="rounded-md border bg-muted/30 p-3">
            <ReceiptPreview receipt={receipt} />
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Chop etish oynasida &quot;Printer&quot; sifatida &quot;PDF sifatida saqlash&quot;ni tanlashingiz mumkin.
        </p>
        <DialogFooter>
          <Button className="w-full gap-2" onClick={() => window.print()}>
            <Printer className="size-4" />
            Chop etish / PDF saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
