"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { createCategory, deleteCategory, createProduct, updateProduct, deleteProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MxikPicker } from "@/components/mxik-picker";
import type { MxikSearchResult } from "@/actions/mxik";
import { formatSom } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  isPublished: boolean;
  categoryId: string | null;
  categoryName: string | null;
  mxikItemId: string | null;
  mxikCode: string | null;
};
type Category = { id: string; name: string };

export function ProductManager({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedMxik, setSelectedMxik] = useState<MxikSearchResult | null>(null);
  const [nameValue, setNameValue] = useState("");

  function refresh() {
    router.refresh();
  }

  function handleAddCategory() {
    if (!newCategory.trim()) return;
    startTransition(async () => {
      const result = await createCategory({ name: newCategory.trim() });
      if (result.ok) {
        setNewCategory("");
        toast.success("Kategoriya qo'shildi");
        refresh();
      } else toast.error(result.error);
    });
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.ok) {
        toast.success("Kategoriya o'chirildi");
        refresh();
      } else toast.error(result.error);
    });
  }

  function handleDeleteProduct(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.ok) {
        toast.success("Mahsulot o'chirildi");
        refresh();
      } else toast.error(result.error);
    });
  }

  function handleSubmitProduct(formData: FormData) {
    const mxikItemId = editing?.mxikItemId ?? selectedMxik?.id;
    if (!mxikItemId) {
      toast.error("Mahsulotni katalogdan tanlang");
      return;
    }

    const input = {
      mxikItemId,
      name: formData.get("name"),
      categoryId: formData.get("categoryId") || null,
      sku: formData.get("sku") || null,
      price: formData.get("price"),
      stock: formData.get("stock"),
      isPublished: formData.get("isPublished") === "on",
    };

    startTransition(async () => {
      const result = editing ? await updateProduct(editing.id, input) : await createProduct(input);
      if (result.ok) {
        toast.success(editing ? "Mahsulot yangilandi" : "Mahsulot qo'shildi");
        setDialogOpen(false);
        setEditing(null);
        setSelectedMxik(null);
        refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mahsulotlar</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              setSelectedMxik(null);
              setNameValue("");
            }
          }}
        >
          <DialogTrigger
            render={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setSelectedMxik(null);
                  setNameValue("");
                }}
              />
            }
          >
            <Plus className="size-4" /> Mahsulot qo&apos;shish
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmitProduct} className="space-y-4">
              {editing ? (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Katalog: {editing.mxikCode ?? "—"}
                </p>
              ) : (
                <MxikPicker
                  onSelect={(item) => {
                    setSelectedMxik(item);
                    setNameValue(item.mxikName);
                  }}
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input
                  id="name"
                  name="name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategoriya</Label>
                <Select name="categoryId" defaultValue={editing?.categoryId ?? undefined}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Kategoriya tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Narxi (so&apos;m)</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editing?.price} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Qoldiq</Label>
                  <Input id="stock" name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (ixtiyoriy)</Label>
                <Input id="sku" name="sku" defaultValue={editing?.sku ?? ""} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isPublished" name="isPublished" defaultChecked={editing?.isPublished} />
                <Label htmlFor="isPublished">Onlayn vitrinada ko&apos;rsatish</Label>
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

      <div>
        <Label className="mb-2 block text-sm">Kategoriyalar</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {initialCategories.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.name}
              <button onClick={() => handleDeleteCategory(c.id)} className="rounded-full p-0.5 hover:bg-muted-foreground/20">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex max-w-xs gap-2">
          <Input
            placeholder="Yangi kategoriya"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddCategory} disabled={pending}>
            Qo&apos;shish
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Kategoriya</TableHead>
              <TableHead>Narxi</TableHead>
              <TableHead>Qoldiq</TableHead>
              <TableHead>Vitrina</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.categoryName ?? "—"}</TableCell>
                <TableCell>{formatSom(p.price)} so&apos;m</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>
                  <Badge variant={p.isPublished ? "default" : "secondary"}>{p.isPublished ? "Ha" : "Yo'q"}</Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setNameValue(p.name);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Hozircha mahsulotlar yo&apos;q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
