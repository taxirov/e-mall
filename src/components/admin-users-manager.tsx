"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createUserAsAdmin } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = { id: string; fullName: string; phone: string; role: string; storeName: string | null };
type StoreType = { id: string; name: string };
type StoreOption = { id: string; name: string };

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  OWNER: "Do'kon egasi",
  SELLER: "Sotuvchi",
  CUSTOMER: "Xaridor",
};

export function AdminUsersManager({
  initialUsers,
  storeTypes,
  stores,
}: {
  initialUsers: UserRow[];
  storeTypes: StoreType[];
  stores: StoreOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState<"CUSTOMER" | "OWNER" | "SELLER" | "SUPER_ADMIN">("CUSTOMER");

  function handleSubmit(formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    let input: Record<string, unknown> = { role, fullName, phone, password };
    if (role === "OWNER") {
      input = {
        ...input,
        storeName: formData.get("storeName"),
        storeTypeIds: formData.getAll("storeTypeIds"),
      };
    } else if (role === "SELLER") {
      input = { ...input, storeId: formData.get("storeId") };
    }

    startTransition(async () => {
      const result = await createUserAsAdmin(input);
      if (result.ok) {
        toast.success("Foydalanuvchi yaratildi");
        setDialogOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Foydalanuvchilar</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setRole("CUSTOMER");
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" /> Foydalanuvchi qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi foydalanuvchi</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Turi</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as typeof role)}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Xaridor</SelectItem>
                    <SelectItem value="OWNER">Do&apos;kon egasi</SelectItem>
                    <SelectItem value="SELLER">Sotuvchi</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">To&apos;liq ism</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqam</Label>
                <PhoneInput />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>

              {role === "OWNER" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Do&apos;kon nomi</Label>
                    <Input id="storeName" name="storeName" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Do&apos;kon turi</Label>
                    <div className="space-y-2 rounded-md border p-3">
                      {storeTypes.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-sm">
                          <Checkbox name="storeTypeIds" value={t.id} />
                          {t.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {role === "SELLER" && (
                <div className="space-y-2">
                  <Label htmlFor="storeId">Do&apos;kon</Label>
                  <Select name="storeId">
                    <SelectTrigger id="storeId" className="w-full">
                      <SelectValue placeholder="Do'kon tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Yaratilmoqda..." : "Yaratish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Do&apos;kon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.phone}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.storeName ?? "—"}</TableCell>
              </TableRow>
            ))}
            {initialUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Hozircha foydalanuvchilar yo&apos;q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
