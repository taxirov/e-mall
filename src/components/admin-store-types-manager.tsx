"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createStoreType, updateStoreType, deleteStoreType } from "@/actions/store-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type StoreType = { id: string; name: string };

export function AdminStoreTypesManager({ initialStoreTypes }: { initialStoreTypes: StoreType[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreType | null>(null);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStoreType(id);
      if (result.ok) {
        toast.success("O'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;

    startTransition(async () => {
      const result = editing ? await updateStoreType(editing.id, { name }) : await createStoreType({ name });
      if (result.ok) {
        toast.success(editing ? "Yangilandi" : "Qo'shildi");
        setDialogOpen(false);
        setEditing(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Do&apos;kon turlari</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={() => setEditing(null)} />}>
            <Plus className="size-4" /> Tur qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Do'kon turini tahrirlash" : "Yangi do'kon turi"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {initialStoreTypes.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="font-medium">{t.name}</span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditing(t);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {initialStoreTypes.length === 0 && <p className="text-sm text-muted-foreground">Hozircha do&apos;kon turlari yo&apos;q</p>}
      </div>
    </div>
  );
}
