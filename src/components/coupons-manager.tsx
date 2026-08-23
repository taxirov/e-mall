"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createCoupon, toggleCouponActive, deleteCoupon } from "@/actions/coupons";
import { COUPON_TYPES } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatSom, formatDateTime } from "@/lib/format";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
};

const TYPE_LABEL: Record<string, string> = { PERCENT: "Foiz", FIXED: "Summa" };

export function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");

  function handleSubmit(formData: FormData) {
    const maxUsesRaw = formData.get("maxUses") as string;
    const expiresAtRaw = formData.get("expiresAt") as string;

    startTransition(async () => {
      const result = await createCoupon({
        code: formData.get("code"),
        type,
        value: formData.get("value"),
        maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
        expiresAt: expiresAtRaw || null,
      });
      if (result.ok) {
        toast.success("Kupon yaratildi");
        setDialogOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleCouponActive(id);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.ok) {
        toast.success("O'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kuponlar</h1>
          <p className="text-sm text-muted-foreground">POS kassasida qo&apos;llash mumkin bo&apos;lgan chegirma kodlari</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" /> Kupon qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi kupon</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kod</Label>
                <Input id="code" name="code" placeholder="masalan: YANGI10" required maxLength={20} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="type">Turi</Label>
                  <Select value={type} onValueChange={(v) => v && setType(v as "PERCENT" | "FIXED")}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUPON_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">{type === "PERCENT" ? "Foiz (%)" : "Summa (so'm)"}</Label>
                  <Input id="value" name="value" type="number" min={1} max={type === "PERCENT" ? 100 : undefined} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Ishlatish limiti (ixtiyoriy)</Label>
                  <Input id="maxUses" name="maxUses" type="number" min={1} placeholder="Cheksiz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Amal qilish muddati (ixtiyoriy)</Label>
                  <Input id="expiresAt" name="expiresAt" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  Yaratish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {initialCoupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{c.code}</span>
                <Badge variant="secondary">
                  {c.type === "PERCENT" ? `${c.value}%` : `${formatSom(c.value)} so'm`}
                </Badge>
                {!c.active && <Badge variant="outline">O&apos;chirilgan</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ishlatilgan: {c.usedCount}
                {c.maxUses != null ? ` / ${c.maxUses}` : " (cheksiz)"}
                {c.expiresAt && ` · Muddati: ${formatDateTime(c.expiresAt)}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch checked={c.active} onCheckedChange={() => handleToggle(c.id)} disabled={pending} />
              <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} disabled={pending}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {initialCoupons.length === 0 && <p className="text-sm text-muted-foreground">Hozircha kuponlar yo&apos;q</p>}
      </div>
    </div>
  );
}
