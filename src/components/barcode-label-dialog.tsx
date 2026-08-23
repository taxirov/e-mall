"use client";

import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Renders a CODE128 barcode label for a product and prints it (browser print dialog — same "Save as PDF" pattern as the POS receipt). */
export function BarcodeLabelDialog({
  open,
  onOpenChange,
  productName,
  barcode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  barcode: string;
}) {
  // State-backed ref: Base UI's Dialog Popup mounts its content one render
  // after `open` flips true, so a plain useRef would still read null here.
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !svgEl) return;
    try {
      JsBarcode(svgEl, barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(false);
    } catch {
      setError(true);
    }
  }, [open, svgEl, barcode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shtrix-kod yorlig&apos;i</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">Bu shtrix-kod uchun yorliq yaratib bo&apos;lmadi</p>
        ) : (
          <div data-print-target className="flex flex-col items-center gap-1 rounded-md border bg-white p-4 text-black">
            <p className="line-clamp-2 text-center text-sm font-medium">{productName}</p>
            <svg ref={setSvgEl} />
          </div>
        )}
        <DialogFooter>
          <Button className="w-full gap-2" disabled={error} onClick={() => window.print()}>
            <Printer className="size-4" />
            Chop etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
