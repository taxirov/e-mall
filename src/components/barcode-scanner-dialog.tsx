"use client";

import { useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Opens the device camera (rear-facing on phones) and decodes a barcode from the live video feed. */
export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onDetected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
}) {
  // A state-backed ref (rather than useRef) so the effect below re-runs once
  // the <video> element actually mounts. The Dialog's content mounts one
  // render after `open` flips true (it animates in), so a plain useRef read
  // inside a [open]-only effect would still see null and silently never
  // start the camera.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoEl) return;
    // Clears a leftover error from a previous attempt before this one starts —
    // not deriving state from props, so the lint rule's concern doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);

    let controls: IScannerControls | undefined;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoEl, (result) => {
        if (cancelled || !result) return;
        cancelled = true;
        controls?.stop();
        onDetected(result.getText());
        onOpenChange(false);
      })
      .then((c) => {
        if (cancelled) c.stop();
        else controls = c;
      })
      .catch(() => setError("Kameraga ruxsat berilmadi yoki u topilmadi"));

    return () => {
      cancelled = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, videoEl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shtrix-kodni skanerlang</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-md bg-black">
            <video ref={setVideoEl} className="aspect-video w-full object-cover" muted playsInline />
          </div>
        )}
        <p className="text-xs text-muted-foreground">Shtrix-kodni kamera oynasi ichiga joylashtiring.</p>
      </DialogContent>
    </Dialog>
  );
}
