"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createCatalogProductAsAdmin, updateCatalogProduct } from "@/actions/catalog-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogFields } from "@/components/catalog-fields";
import type { CategoryTreeNode } from "@/components/category-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CatalogProduct = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  size: string | null;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  createdByStoreName: string | null;
  storeCount: number;
};

export function AdminProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: CatalogProduct[];
  categories: CategoryTreeNode[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState("");

  const filtered = initialProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  function handleSubmit(formData: FormData) {
    const input = {
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      brand: (formData.get("brand") as string) || null,
      unit: formData.get("unit"),
      size: (formData.get("size") as string) || null,
      barcode: (formData.get("barcode") as string) || null,
      description: (formData.get("description") as string) || null,
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    startTransition(async () => {
      const result = editing ? await updateCatalogProduct(editing.id, input) : await createCatalogProductAsAdmin(input);
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mahsulotlar katalogi</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={() => setEditing(null)} />}>
            <Plus className="size-4" /> Mahsulot qo&apos;shish
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <CatalogFields defaults={editing ?? undefined} categories={categories} />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Kategoriya</TableHead>
              <TableHead>Yaratgan</TableHead>
              <TableHead>Do&apos;konlar</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="size-9 overflow-hidden rounded bg-muted">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {p.name}
                  {p.size ? `, ${p.size}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.categoryName}</TableCell>
                <TableCell className="text-muted-foreground">{p.createdByStoreName ?? "Administrator"}</TableCell>
                <TableCell>{p.storeCount}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p);
                      setDialogOpen(true);
                    }}
                  >
                    Tahrirlash
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Hech narsa topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
