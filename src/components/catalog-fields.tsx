"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelect, type CategoryTreeNode } from "@/components/category-select";
import { ImageUpload } from "@/components/image-upload";
import { BarcodeLookup } from "@/components/barcode-lookup";
import type { SoliqLookupResult } from "@/lib/soliq";
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
  soliqId?: string | null;
  soliqPosition?: string | null;
  soliqBrand?: string | null;
  mxikCode?: string | null;
};

export type ProductAttributeDef = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT";
  options: string[];
};

/** Shared/global catalog-product fields — used for creating/editing a CatalogProduct, both by the store that owns it and by Super Admin. */
export function CatalogFields({
  defaults,
  categories,
  attributes = [],
  defaultAttributeValues = {},
  title = "Katalog ma'lumotlari (barcha do'konlar uchun umumiy)",
}: {
  defaults?: CatalogProductDefaults;
  categories: CategoryTreeNode[];
  attributes?: ProductAttributeDef[];
  defaultAttributeValues?: Record<string, string>;
  title?: string;
}) {
  const [name, setName] = useState(defaults?.name ?? "");
  const [brand, setBrand] = useState(defaults?.brand ?? "");
  const [barcode, setBarcode] = useState(defaults?.barcode ?? "");
  const [soliq, setSoliq] = useState({
    soliqId: defaults?.soliqId ?? "",
    soliqPosition: defaults?.soliqPosition ?? "",
    soliqBrand: defaults?.soliqBrand ?? "",
    mxikCode: defaults?.mxikCode ?? "",
  });

  function handleFound(result: SoliqLookupResult) {
    setBarcode(result.barcode);
    setBrand(result.suggestedName);
    if (!name) setName(result.suggestedName);
    setSoliq({
      soliqId: result.soliqId,
      soliqPosition: result.soliqPosition,
      soliqBrand: result.soliqBrand,
      mxikCode: result.mxikCode,
    });
  }

  return (
    <div className="space-y-4 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <BarcodeLookup onFound={handleFound} />
      <input type="hidden" name="soliqId" value={soliq.soliqId} />
      <input type="hidden" name="soliqPosition" value={soliq.soliqPosition} />
      <input type="hidden" name="soliqBrand" value={soliq.soliqBrand} />
      <input type="hidden" name="mxikCode" value={soliq.mxikCode} />
      <div className="space-y-2">
        <Label htmlFor="name">Nomi</Label>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <CategorySelect categories={categories} defaultCategoryId={defaults?.categoryId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Brend (ixtiyoriy)</Label>
          <Input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
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
          <Input id="barcode" name="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </div>
      </div>
      <ImageUpload defaultUrl={defaults?.imageUrl} />
      <div className="space-y-2">
        <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
        <Textarea id="description" name="description" defaultValue={defaults?.description ?? ""} rows={2} />
      </div>

      {attributes.length > 0 && (
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Qo&apos;shimcha maydonlar</p>
          {attributes.map((attr) => (
            <AttributeField key={attr.id} attribute={attr} defaultValue={defaultAttributeValues[attr.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

function AttributeField({ attribute, defaultValue }: { attribute: ProductAttributeDef; defaultValue?: string }) {
  const name = `attr_${attribute.id}`;
  if (attribute.type === "BOOLEAN") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name={name} value="true" defaultChecked={defaultValue === "true"} />
        {attribute.name}
      </label>
    );
  }
  if (attribute.type === "SELECT") {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{attribute.name}</Label>
        <Select name={name} defaultValue={defaultValue ?? undefined}>
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {attribute.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{attribute.name}</Label>
      <Input id={name} name={name} type={attribute.type === "NUMBER" ? "number" : "text"} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
