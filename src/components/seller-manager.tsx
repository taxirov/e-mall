"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { inviteSeller, removeSeller } from "@/actions/sellers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type Seller = { id: string; fullName: string; phone: string; createdAt: string };

export function SellerManager({ initialSellers }: { initialSellers: Seller[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleInvite(formData: FormData) {
    startTransition(async () => {
      const result = await inviteSeller({
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        password: formData.get("password"),
      });
      if (result.ok) {
        toast.success("Sotuvchi qo'shildi");
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeSeller(id);
      if (result.ok) {
        toast.success("Sotuvchi o'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sotuvchilar</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" /> Sotuvchi qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi sotuvchi</DialogTitle>
            </DialogHeader>
            <form action={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">To&apos;liq ismi</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqam</Label>
                <PhoneInput />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Vaqtinchalik parol</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  Qo&apos;shish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {initialSellers.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{s.fullName}</CardTitle>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <Button size="icon" variant="ghost" disabled={pending} onClick={() => handleRemove(s.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
          </Card>
        ))}
        {initialSellers.length === 0 && (
          <CardContent className="text-sm text-muted-foreground">Hozircha sotuvchilar yo&apos;q.</CardContent>
        )}
      </div>
    </div>
  );
}
