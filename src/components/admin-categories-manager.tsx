"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ChevronRight, ChevronDown, Search } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { useLatinizedSearch } from "@/hooks/use-latinized-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const searchTerm = useLatinizedSearch(search);

  const topLevel = initialCategories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of initialCategories) {
    if (!c.parentId) continue;
    childrenByParent.set(c.parentId, [...(childrenByParent.get(c.parentId) ?? []), c]);
  }
  const storeTypeNameById = new Map(storeTypes.map((t) => [t.id, t.name]));

  const isSearching = searchTerm.trim().length > 0;
  const q = searchTerm.trim().toLowerCase();

  // While searching, each top-level category shows only its matching
  // children (or all of them, if the top-level name itself matched) and is
  // force-expanded; groups with no match at all drop out entirely.
  const visibleTopLevel = useMemo(() => {
    return topLevel
      .map((c) => {
        const children = childrenByParent.get(c.id) ?? [];
        if (!isSearching) return { category: c, children, matched: true };
        const selfMatches = c.name.toLowerCase().includes(q);
        const matchingChildren = children.filter((ch) => ch.name.toLowerCase().includes(q));
        const matched = selfMatches || matchingChildren.length > 0;
        return { category: c, children: selfMatches ? children : matchingChildren, matched };
      })
      .filter((entry) => entry.matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topLevel, initialCategories, isSearching, q]);

  const topLevelByStoreType = new Map<string, typeof visibleTopLevel>();
  for (const entry of visibleTopLevel) {
    topLevelByStoreType.set(entry.category.storeTypeId, [...(topLevelByStoreType.get(entry.category.storeTypeId) ?? []), entry]);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kategoriya yoki subkategoriya qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-6">
        {storeTypes.map((storeType) => {
          const entries = topLevelByStoreType.get(storeType.id) ?? [];
          if (entries.length === 0) return null;
          return (
            <div key={storeType.id} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{storeType.name}</h2>
              {entries.map(({ category: c, children }) => {
                const isOpen = isSearching || expanded.has(c.id);
                return (
                  <div key={c.id} className="rounded-md border">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleExpanded(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpanded(c.id);
                        }
                      }}
                      className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        {children.length > 0 ? (
                          isOpen ? (
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="size-4 shrink-0" />
                        )}
                        {c.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" className="size-6 shrink-0 rounded object-cover" />
                        )}
                        <span className="truncate">{c.name}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {storeTypeNameById.get(c.storeTypeId)}
                        </Badge>
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {isOpen &&
                      children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between border-t px-3 py-2 pl-9">
                          <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            {child.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={child.imageUrl} alt="" className="size-5 shrink-0 rounded object-cover" />
                            )}
                            <span className="truncate">{child.name}</span>
                            <Badge variant="secondary" className="shrink-0">
                              {storeTypeNameById.get(child.storeTypeId)}
                            </Badge>
                          </span>
                          <div className="flex shrink-0 gap-1">
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
                );
              })}
            </div>
          );
        })}
        {topLevel.length === 0 && <p className="text-sm text-muted-foreground">Hozircha kategoriyalar yo&apos;q</p>}
        {topLevel.length > 0 && visibleTopLevel.length === 0 && (
          <p className="text-sm text-muted-foreground">Hech narsa topilmadi</p>
        )}
      </div>
    </div>
  );
}
