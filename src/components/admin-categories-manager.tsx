"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ChevronRight } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = { id: string; name: string; parentId: string | null };

export function AdminCategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [newParentId, setNewParentId] = useState<string>("");

  const topLevel = initialCategories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of initialCategories) {
    if (!c.parentId) continue;
    childrenByParent.set(c.parentId, [...(childrenByParent.get(c.parentId) ?? []), c]);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.ok) {
        toast.success("O'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    const parentId = (formData.get("parentId") as string) || null;

    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, { name })
        : await createCategory({ name, parentId });
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
        <h1 className="text-xl font-semibold">Kategoriyalar</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              setNewParentId("");
            }
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={() => setEditing(null)} />}>
            <Plus className="size-4" /> Kategoriya qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              {!editing && (
                <div className="space-y-2">
                  <Label htmlFor="parentId">Yuqori kategoriya (ixtiyoriy — bo&apos;sh qoldirilsa, top-daraja kategoriya bo&apos;ladi)</Label>
                  <Select name="parentId" value={newParentId} onValueChange={(value) => setNewParentId(value ?? "")}>
                    <SelectTrigger id="parentId" className="w-full">
                      <SelectValue placeholder="Yo'q — top-daraja" />
                    </SelectTrigger>
                    <SelectContent>
                      {topLevel.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {topLevel.map((c) => (
          <div key={c.id} className="rounded-md border">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-medium">{c.name}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {(childrenByParent.get(c.id) ?? []).map((child) => (
              <div key={child.id} className="flex items-center justify-between border-t px-3 py-2 pl-6">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ChevronRight className="size-3.5" /> {child.name}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(child); setDialogOpen(true); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(child.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {topLevel.length === 0 && <p className="text-sm text-muted-foreground">Hozircha kategoriyalar yo&apos;q</p>}
      </div>
    </div>
  );
}
