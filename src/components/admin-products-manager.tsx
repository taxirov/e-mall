"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Barcode, QrCode } from "lucide-react";
import { createCatalogProductAsAdmin, updateCatalogProduct } from "@/actions/catalog-products";
import { collectAttributeValues } from "@/lib/collect-attribute-values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CatalogFields, type ProductAttributeDef } from "@/components/catalog-fields";
import { BarcodeLabelDialog } from "@/components/barcode-label-dialog";
import { MxikQrDialog } from "@/components/mxik-qr-dialog";
import type { CategoryTreeNode } from "@/components/category-select";
import { useLatinizedSearch } from "@/hooks/use-latinized-search";
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
  soliqId: string | null;
  soliqPosition: string | null;
  soliqBrand: string | null;
  mxikCode: string | null;
  attributeValues: Record<string, string>;
};

export function AdminProductsManager({
  initialProducts,
  categories,
  attributes,
}: {
  initialProducts: CatalogProduct[];
  categories: CategoryTreeNode[];
  attributes: ProductAttributeDef[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState("");
  const [labelTarget, setLabelTarget] = useState<CatalogProduct | null>(null);
  const [qrTarget, setQrTarget] = useState<CatalogProduct | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [listingFilter, setListingFilter] = useState<"all" | "listed" | "unlisted">("all");
  const searchTerm = useLatinizedSearch(search);

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of initialProducts) seen.set(p.categoryId, p.categoryName);
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [initialProducts]);

  const creatorOptions = useMemo(() => {
    const seen = new Set(initialProducts.map((p) => p.createdByStoreName ?? "Administrator"));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [initialProducts]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return initialProducts.filter((p) => {
      if (q) {
        const haystack = [p.name, p.brand ?? "", p.barcode ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (creatorFilter !== "all" && (p.createdByStoreName ?? "Administrator") !== creatorFilter) return false;
      if (listingFilter === "listed" && p.storeCount === 0) return false;
      if (listingFilter === "unlisted" && p.storeCount > 0) return false;
      return true;
    });
  }, [initialProducts, searchTerm, categoryFilter, creatorFilter, listingFilter]);

  const filtersActive = search !== "" || categoryFilter !== "all" || creatorFilter !== "all" || listingFilter !== "all";

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setCreatorFilter("all");
    setListingFilter("all");
  }

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
      soliqId: (formData.get("soliqId") as string) || null,
      soliqPosition: (formData.get("soliqPosition") as string) || null,
      soliqBrand: (formData.get("soliqBrand") as string) || null,
      mxikCode: (formData.get("mxikCode") as string) || null,
      attributes: collectAttributeValues(formData, attributes),
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <CatalogFields
                defaults={editing ?? undefined}
                categories={categories}
                attributes={attributes}
                defaultAttributeValues={editing?.attributeValues}
              />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {editing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Qidirish: nomi, brend, shtrix-kod..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs flex-1"
          />
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={creatorFilter} onValueChange={(v) => v && setCreatorFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Yaratgan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha yaratuvchilar</SelectItem>
              {creatorOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={listingFilter} onValueChange={(v) => v && setListingFilter(v as typeof listingFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Do'konlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="listed">Kamida bitta do&apos;konda bor</SelectItem>
              <SelectItem value="unlisted">Hali hech qayerda yo&apos;q</SelectItem>
            </SelectContent>
          </Select>
          {filtersActive && (
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              Filtrlarni tozalash
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} / {initialProducts.length} mahsulot
        </p>
      </div>

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
                <TableCell className="flex justify-end gap-1.5">
                  {p.barcode && (
                    <Button size="icon" variant="ghost" onClick={() => setLabelTarget(p)} title="Shtrix-kod yorlig'ini chop etish">
                      <Barcode className="size-4" />
                    </Button>
                  )}
                  {p.mxikCode && (
                    <Button size="icon" variant="ghost" onClick={() => setQrTarget(p)} title="MXIK QR kodini chop etish">
                      <QrCode className="size-4" />
                    </Button>
                  )}
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
                  {initialProducts.length === 0 ? "Hozircha mahsulotlar yo'q" : "Filtrga mos mahsulot topilmadi"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {labelTarget && (
        <BarcodeLabelDialog
          open={!!labelTarget}
          onOpenChange={(open) => !open && setLabelTarget(null)}
          productName={labelTarget.name}
          barcode={labelTarget.barcode!}
        />
      )}
      {qrTarget && (
        <MxikQrDialog
          open={!!qrTarget}
          onOpenChange={(open) => !open && setQrTarget(null)}
          productName={qrTarget.name}
          mxikCode={qrTarget.mxikCode!}
        />
      )}
    </div>
  );
}
