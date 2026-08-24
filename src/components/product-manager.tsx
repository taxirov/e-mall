"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Send, Barcode, QrCode } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/actions/products";
import { updateCatalogProduct, requestProductEdit, type CatalogProductSearchResult } from "@/actions/catalog-products";
import { collectAttributeValues } from "@/lib/collect-attribute-values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CatalogProductPicker } from "@/components/catalog-product-picker";
import { type CategoryTreeNode } from "@/components/category-select";
import { ImageUpload } from "@/components/image-upload";
import { CatalogFields, type ProductAttributeDef } from "@/components/catalog-fields";
import { BarcodeLabelDialog } from "@/components/barcode-label-dialog";
import { MxikQrDialog } from "@/components/mxik-qr-dialog";
import { formatSom } from "@/lib/format";
import { isDiscountActive } from "@/lib/effective-price";
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
  sku: string | null;
  price: string;
  costPrice: string | null;
  stock: number;
  lowStockThreshold: number | null;
  expiryDate: string | null;
  isPublished: boolean;
  isNew: boolean;
  discountPrice: string | null;
  discountEndsAt: string | null;
  catalogProduct: {
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
    createdByStoreId: string | null;
    soliqId: string | null;
    soliqPosition: string | null;
    soliqBrand: string | null;
    mxikCode: string | null;
    attributeValues: Record<string, string>;
  };
};

export function ProductManager({
  initialProducts,
  categories,
  storeId,
  attributes,
}: {
  initialProducts: Product[];
  categories: CategoryTreeNode[];
  storeId: string;
  attributes: ProductAttributeDef[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogProductSearchResult | null>(null);
  const [requestTarget, setRequestTarget] = useState<Product | null>(null);
  const [labelTarget, setLabelTarget] = useState<Product | null>(null);
  const [qrTarget, setQrTarget] = useState<Product | null>(null);

  function resetDialog() {
    setEditing(null);
    setCreatingNew(false);
    setSelectedCatalog(null);
  }

  function handleDeleteProduct(id: string) {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.ok) {
        toast.success("Mahsulot o'chirildi");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleSubmitProduct(formData: FormData) {
    const operational = {
      sku: (formData.get("sku") as string) || null,
      price: formData.get("price"),
      costPrice: formData.get("costPrice") || null,
      stock: formData.get("stock"),
      lowStockThreshold: formData.get("lowStockThreshold") || null,
      expiryDate: (formData.get("expiryDate") as string) || null,
      supplier: (formData.get("supplier") as string) || null,
      isPublished: formData.get("isPublished") === "on",
      isNew: formData.get("isNew") === "on",
      discountPrice: formData.get("discountPrice") || null,
      discountEndsAt: (formData.get("discountEndsAt") as string) || null,
    };

    startTransition(async () => {
      if (editing) {
        const isCreator = editing.catalogProduct.createdByStoreId === storeId;
        if (isCreator) {
          const catalogInput = {
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
          const catalogResult = await updateCatalogProduct(editing.catalogProduct.id, catalogInput);
          if (!catalogResult.ok) {
            toast.error(catalogResult.error);
            return;
          }
        }
        const result = await updateProduct(editing.id, { catalogProductId: editing.catalogProduct.id, ...operational });
        if (result.ok) {
          toast.success("Mahsulot yangilandi");
          setDialogOpen(false);
          resetDialog();
          router.refresh();
        } else toast.error(result.error);
        return;
      }

      let input: Record<string, unknown>;
      if (selectedCatalog) {
        input = { catalogProductId: selectedCatalog.id, ...operational };
      } else if (creatingNew) {
        input = {
          newCatalogProduct: {
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
          },
          ...operational,
        };
      } else {
        toast.error("Mahsulotni katalogdan tanlang yoki yangisini yarating");
        return;
      }

      const result = await createProduct(input);
      if (result.ok) {
        toast.success("Mahsulot qo'shildi");
        setDialogOpen(false);
        resetDialog();
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function handleRequestEdit(formData: FormData) {
    if (!requestTarget) return;
    const changes: Record<string, unknown> = {};
    for (const key of ["name", "brand", "unit", "size", "barcode", "description", "imageUrl"]) {
      const value = formData.get(key);
      if (value) changes[key] = value;
    }
    const note = (formData.get("note") as string) || undefined;

    startTransition(async () => {
      const result = await requestProductEdit(requestTarget.catalogProduct.id, { changes, note });
      if (result.ok) {
        toast.success("So'rov adminga yuborildi");
        setRequestTarget(null);
      } else toast.error(result.error);
    });
  }

  const isEditingCreator = editing ? editing.catalogProduct.createdByStoreId === storeId : true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mahsulotlar</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger
            render={
              <Button
                size="sm"
                onClick={() => {
                  resetDialog();
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
                isEditingCreator ? (
                  <CatalogFields
                    defaults={editing.catalogProduct}
                    categories={categories}
                    attributes={attributes}
                    defaultAttributeValues={editing.catalogProduct.attributeValues}
                  />
                ) : (
                  <div className="space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium">{editing.catalogProduct.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {editing.catalogProduct.categoryName} · Boshqa do&apos;kon yaratgan — o&apos;zgartirish uchun so&apos;rov yuboring
                    </p>
                  </div>
                )
              ) : creatingNew ? (
                <CatalogFields categories={categories} attributes={attributes} />
              ) : (
                <CatalogProductPicker
                  onSelect={(item) => setSelectedCatalog(item)}
                  onCreateNew={() => setCreatingNew(true)}
                />
              )}

              {(editing || selectedCatalog || creatingNew) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="price">Sotish narxi (so&apos;m)</Label>
                      <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editing?.price} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Sotib olingan narx (so&apos;m)</Label>
                      <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={editing?.costPrice ?? ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="stock">{editing ? "Qoldiq" : "Boshlang'ich miqdor"}</Label>
                      <Input id="stock" name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Kam qoldiq chegarasi (ixtiyoriy)</Label>
                      <Input
                        id="lowStockThreshold"
                        name="lowStockThreshold"
                        type="number"
                        min="0"
                        defaultValue={editing?.lowStockThreshold ?? ""}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Yaroqlilik muddati (ixtiyoriy)</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="date"
                        defaultValue={editing?.expiryDate ? editing.expiryDate.slice(0, 10) : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU (ixtiyoriy)</Label>
                      <Input id="sku" name="sku" defaultValue={editing?.sku ?? ""} />
                    </div>
                  </div>
                  {!editing && (
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Yetkazib beruvchi (ixtiyoriy)</Label>
                      <Input id="supplier" name="supplier" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="discountPrice">Chegirma narxi (ixtiyoriy)</Label>
                      <Input
                        id="discountPrice"
                        name="discountPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={editing?.discountPrice ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountEndsAt">Chegirma tugash vaqti</Label>
                      <Input
                        id="discountEndsAt"
                        name="discountEndsAt"
                        type="datetime-local"
                        defaultValue={editing?.discountEndsAt ? editing.discountEndsAt.slice(0, 16) : ""}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch id="isPublished" name="isPublished" defaultChecked={editing?.isPublished} />
                      <Label htmlFor="isPublished">Onlayn vitrinada ko&apos;rsatish</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="isNew" name="isNew" defaultChecked={editing?.isNew} />
                      <Label htmlFor="isNew">Yangilik</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={pending}>
                      {editing ? "Saqlash" : "Qo'shish"}
                    </Button>
                  </DialogFooter>
                </>
              )}
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
            {initialProducts.map((p) => {
              const lowStock = p.lowStockThreshold != null && p.stock <= p.lowStockThreshold;
              const discountActive = isDiscountActive(p.discountPrice ? Number(p.discountPrice) : null, p.discountEndsAt);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="size-9 overflow-hidden rounded bg-muted">
                      {p.catalogProduct.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.catalogProduct.imageUrl} alt="" className="size-full object-cover" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {p.catalogProduct.name}
                      {p.catalogProduct.size ? `, ${p.catalogProduct.size}` : ""}
                      {p.isNew && (
                        <Badge variant="default" className="bg-brand text-brand-foreground">
                          Yangilik
                        </Badge>
                      )}
                      {discountActive && <Badge variant="destructive">Chegirma</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.catalogProduct.categoryName}</TableCell>
                  <TableCell>
                    {discountActive ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground line-through">{formatSom(p.price)} so&apos;m</span>
                        <span className="font-medium text-destructive">{formatSom(p.discountPrice!)} so&apos;m</span>
                      </div>
                    ) : (
                      `${formatSom(p.price)} so'm`
                    )}
                  </TableCell>
                  <TableCell>
                    {p.stock}
                    {lowStock && (
                      <Badge variant="destructive" className="ml-1.5">
                        Kam
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isPublished ? "default" : "secondary"}>{p.isPublished ? "Ha" : "Yo'q"}</Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    {p.catalogProduct.barcode && (
                      <Button size="icon" variant="ghost" onClick={() => setLabelTarget(p)} title="Shtrix-kod yorlig'ini chop etish">
                        <Barcode className="size-4" />
                      </Button>
                    )}
                    {p.catalogProduct.mxikCode && (
                      <Button size="icon" variant="ghost" onClick={() => setQrTarget(p)} title="MXIK QR kodini chop etish">
                        <QrCode className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(p);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {p.catalogProduct.createdByStoreId !== storeId && (
                      <Button size="icon" variant="ghost" onClick={() => setRequestTarget(p)}>
                        <Send className="size-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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

      <Dialog open={!!requestTarget} onOpenChange={(open) => !open && setRequestTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tahrirlashni so&apos;rash</DialogTitle>
          </DialogHeader>
          {requestTarget && (
            <form action={handleRequestEdit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Faqat o&apos;zgartirmoqchi bo&apos;lgan maydonlarni to&apos;ldiring — bo&apos;shlari o&apos;zgarishsiz qoladi. So&apos;rov
                administratorga yuboriladi.
              </p>
              <div className="space-y-2">
                <Label htmlFor="req-name">Nomi</Label>
                <Input id="req-name" name="name" placeholder={requestTarget.catalogProduct.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="req-brand">Brend</Label>
                  <Input id="req-brand" name="brand" placeholder={requestTarget.catalogProduct.brand ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-size">Hajmi</Label>
                  <Input id="req-size" name="size" placeholder={requestTarget.catalogProduct.size ?? ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="req-unit">O&apos;lchov birligi</Label>
                  <Input id="req-unit" name="unit" placeholder={requestTarget.catalogProduct.unit} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-barcode">Shtrix-kod</Label>
                  <Input id="req-barcode" name="barcode" placeholder={requestTarget.catalogProduct.barcode ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-description">Tavsif</Label>
                <Textarea id="req-description" name="description" placeholder={requestTarget.catalogProduct.description ?? ""} rows={2} />
              </div>
              <ImageUpload label="Yangi rasm (ixtiyoriy)" />
              <div className="space-y-2">
                <Label htmlFor="req-note">Izoh (ixtiyoriy)</Label>
                <Textarea id="req-note" name="note" rows={2} placeholder="Nima uchun o'zgartirish kerakligini yozing" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  So&apos;rov yuborish
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {labelTarget && (
        <BarcodeLabelDialog
          open={!!labelTarget}
          onOpenChange={(open) => !open && setLabelTarget(null)}
          productName={labelTarget.catalogProduct.name}
          barcode={labelTarget.catalogProduct.barcode!}
        />
      )}
      {qrTarget && (
        <MxikQrDialog
          open={!!qrTarget}
          onOpenChange={(open) => !open && setQrTarget(null)}
          productName={qrTarget.catalogProduct.name}
          mxikCode={qrTarget.catalogProduct.mxikCode!}
        />
      )}
    </div>
  );
}
