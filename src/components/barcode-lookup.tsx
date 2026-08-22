"use client";

import { useState } from "react";
import { useTransition } from "react";
import { ScanLine, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupBarcode, type SoliqLookupResult } from "@/lib/soliq";
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";

/**
 * Looks a barcode up against Soliq's MXIK classifier (tasnif.soliq.uz) and
 * hands the result to the parent to pre-fill the rest of the catalog-product
 * form. Purely a lookup helper — nothing here is submitted with the form.
 */
export function BarcodeLookup({ onFound }: { onFound: (result: SoliqLookupResult) => void }) {
  const [code, setCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runLookup(barcode: string) {
    setError(null);
    startTransition(async () => {
      const result = await lookupBarcode(barcode);
      if (result.ok) {
        onFound(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Shtrix-kod orqali qidirish (soliq.uz MXIK bazasidan)
      </p>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          placeholder="Shtrix-kodni kiriting"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (code) runLookup(code);
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Kamera bilan skanerlash">
          <ScanLine className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={!code || pending} onClick={() => runLookup(code)} title="Qidirish">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={(detected) => {
          setCode(detected);
          runLookup(detected);
        }}
      />
    </div>
  );
}
