"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setStoreStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function StoreStatusActions({ storeId, status }: { storeId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  function updateStatus(next: "ACTIVE" | "SUSPENDED" | "PENDING") {
    startTransition(async () => {
      const result = await setStoreStatus(storeId, next);
      if (result.ok) toast.success("Do'kon holati yangilandi");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "ACTIVE" && (
        <Button size="sm" disabled={pending} onClick={() => updateStatus("ACTIVE")}>
          Tasdiqlash
        </Button>
      )}
      {status !== "SUSPENDED" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => updateStatus("SUSPENDED")}>
          Bloklash
        </Button>
      )}
      {status === "SUSPENDED" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus("PENDING")}>
          Kutish holatiga qaytarish
        </Button>
      )}
    </div>
  );
}
