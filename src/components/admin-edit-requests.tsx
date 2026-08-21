"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { reviewEditRequest } from "@/actions/catalog-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

type EditRequest = {
  id: string;
  catalogProductName: string;
  storeName: string;
  requestedByName: string;
  changes: Record<string, unknown>;
  note: string | null;
  createdAt: string;
};

const FIELD_LABEL: Record<string, string> = {
  name: "Nomi",
  brand: "Brend",
  unit: "O'lchov birligi",
  size: "Hajmi",
  barcode: "Shtrix-kod",
  description: "Tavsif",
  imageUrl: "Rasm",
};

export function AdminEditRequests({ initialRequests }: { initialRequests: EditRequest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleReview(id: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await reviewEditRequest(id, decision);
      if (result.ok) {
        toast.success(decision === "APPROVED" ? "Tasdiqlandi" : "Rad etildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Tahrirlash so&apos;rovlari</h1>
      <div className="grid gap-3">
        {initialRequests.map((r) => (
          <Card key={r.id}>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-base">{r.catalogProductName}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {r.storeName} · {r.requestedByName} · {formatDateTime(r.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1 text-sm">
                {Object.entries(r.changes).map(([field, value]) => (
                  <li key={field}>
                    <span className="text-muted-foreground">{FIELD_LABEL[field] ?? field}:</span>{" "}
                    {field === "imageUrl" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(value)} alt="" className="mt-1 size-12 rounded object-cover" />
                    ) : (
                      String(value)
                    )}
                  </li>
                ))}
              </ul>
              {r.note && <p className="text-sm text-muted-foreground italic">&quot;{r.note}&quot;</p>}
              <div className="flex gap-2">
                <Button size="sm" disabled={pending} onClick={() => handleReview(r.id, "APPROVED")}>
                  <Check className="size-4" /> Tasdiqlash
                </Button>
                <Button size="sm" variant="destructive" disabled={pending} onClick={() => handleReview(r.id, "REJECTED")}>
                  <X className="size-4" /> Rad etish
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {initialRequests.length === 0 && <p className="text-sm text-muted-foreground">Hozircha so&apos;rovlar yo&apos;q</p>}
      </div>
    </div>
  );
}
