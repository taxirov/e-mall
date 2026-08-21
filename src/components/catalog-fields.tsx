"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelect, type CategoryTreeNode } from "@/components/category-select";
import { ImageUpload } from "@/components/image-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIT_OPTIONS } from "@/lib/validations";

export type CatalogProductDefaults = {
  name: string;
  brand: string | null;
  unit: string;
  size: string | null;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
};

/** Shared/global catalog-product fields — used for creating/editing a CatalogProduct, both by the store that owns it and by Super Admin. */
export function CatalogFields({
  defaults,
  categories,
  title = "Katalog ma'lumotlari (barcha do'konlar uchun umumiy)",
}: {
  defaults?: CatalogProductDefaults;
  categories: CategoryTreeNode[];
  title?: string;
}) {
  return (
    <div className="space-y-4 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-2">
        <Label htmlFor="name">Nomi</Label>
        <Input id="name" name="name" defaultValue={defaults?.name} required />
      </div>
      <CategorySelect categories={categories} defaultCategoryId={defaults?.categoryId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Brend (ixtiyoriy)</Label>
          <Input id="brand" name="brand" defaultValue={defaults?.brand ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">Hajmi (ixtiyoriy)</Label>
          <Input id="size" name="size" placeholder="masalan: 1,5 l" defaultValue={defaults?.size ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit">O&apos;lchov birligi</Label>
          <Select name="unit" defaultValue={defaults?.unit ?? "dona"}>
            <SelectTrigger id="unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Shtrix-kod (ixtiyoriy)</Label>
          <Input id="barcode" name="barcode" defaultValue={defaults?.barcode ?? ""} />
        </div>
      </div>
      <ImageUpload defaultUrl={defaults?.imageUrl} />
      <div className="space-y-2">
        <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
        <Textarea id="description" name="description" defaultValue={defaults?.description ?? ""} rows={2} />
      </div>
    </div>
  );
}
