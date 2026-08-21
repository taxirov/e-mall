"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ChevronRight } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = { id: string; name: string; parentId: string | null; storeTypeId: string; imageUrl: string | null };
type StoreType = { id: string; name: string };

export function AdminCategoriesManager({
  initialCategories,
  storeTypes,
}: {
  initialCategories: Category[];
  storeTypes: StoreType[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [newParentId, setNewParentId] = useState<string>("");
  const [newStoreTypeId, setNewStoreTypeId] = useState<string>("");

  const topLevel = initialCategories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of initialCategories) {
    if (!c.parentId) continue;
    childrenByParent.set(c.parentId, [...(childrenByParent.get(c.parentId) ?? []), c]);
  }
  const storeTypeNameById = new Map(storeTypes.map((t) => [t.id, t.name]));
  const topLevelByStoreType = new Map<string, Category[]>();
  for (const c of topLevel) {
    topLevelByStoreType.set(c.storeTypeId, [...(topLevelByStoreType.get(c.storeTypeId) ?? []), c]);
  }

  const parentStoreTypeId = topLevel.find((c) => c.id === newParentId)?.storeTypeId;

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
    const storeTypeId = (formData.get("storeTypeId") as string) || "";
    const imageUrl = (formData.get("imageUrl") as string) || null;

    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, { name, imageUrl })
        : await createCategory({ name, parentId, storeTypeId, imageUrl });
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
              setNewStoreTypeId("");
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
                <>
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Yuqori kategoriya (ixtiyoriy — bo&apos;sh qoldirilsa, top-daraja kategoriya bo&apos;ladi)</Label>
                    <Select name="parentId" value={newParentId} onValueChange={(value) => setNewParentId(value ?? "")}>
                      <SelectTrigger id="parentId" className="w-full">
                        <SelectValue placeholder="Yo'q — top-daraja" />
                      </SelectTrigger>
                      <SelectContent>
                        {topLevel.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({storeTypeNameById.get(c.storeTypeId)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newParentId ? (
                    <input type="hidden" name="storeTypeId" value={parentStoreTypeId ?? ""} />
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="storeTypeId">Do&apos;kon turi</Label>
                      <Select name="storeTypeId" value={newStoreTypeId} onValueChange={(value) => setNewStoreTypeId(value ?? "")}>
                        <SelectTrigger id="storeTypeId" className="w-full">
                          <SelectValue placeholder="Do'kon turini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {storeTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
              <ImageUpload defaultUrl={editing?.imageUrl} />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {storeTypes.map((storeType) => {
          const categories = topLevelByStoreType.get(storeType.id) ?? [];
          if (categories.length === 0) return null;
          return (
            <div key={storeType.id} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{storeType.name}</h2>
              {categories.map((c) => (
                <div key={c.id} className="rounded-md border">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      {c.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" className="size-6 rounded object-cover" />
                      )}
                      {c.name}
                    </span>
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
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ChevronRight className="size-3.5" />
                        {child.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={child.imageUrl} alt="" className="size-5 rounded object-cover" />
                        )}
                        {child.name}
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
            </div>
          );
        })}
        {topLevel.length === 0 && <p className="text-sm text-muted-foreground">Hozircha kategoriyalar yo&apos;q</p>}
      </div>
    </div>
  );
}
