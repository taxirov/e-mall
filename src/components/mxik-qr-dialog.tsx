"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Renders the product's MXIK classifier code as a QR label and prints it — same pattern as BarcodeLabelDialog. */
export function MxikQrDialog({
  open,
  onOpenChange,
  productName,
  mxikCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  mxikCode: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Resets a stale QR/error from a previous open — genuinely triggered by
    // the dialog reopening, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);
    QRCode.toDataURL(mxikCode, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mxikCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MXIK QR kodi</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">QR kod yaratib bo&apos;lmadi</p>
        ) : (
          <div data-print-target className="flex flex-col items-center gap-2 rounded-md border bg-white p-4 text-black">
            <p className="line-clamp-2 text-center text-sm font-medium">{productName}</p>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="" className="size-48" />
            )}
            <p className="text-xs">{mxikCode}</p>
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
