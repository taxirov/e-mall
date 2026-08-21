"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/products";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  isPublished: boolean;
  categoryName: string | null;
  mxikItemId: string | null;
  mxikCode: string | null;
  imageUrl: string | null;
};

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedMxik, setSelectedMxik] = useState<MxikSearchResult | null>(null);
  const [nameValue, setNameValue] = useState("");

  function refresh() {
    router.refresh();
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

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
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
                <TableCell>
                  <div className="size-9 overflow-hidden rounded bg-muted">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                </TableCell>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
