"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CategoryTreeNode = { id: string; name: string; parentId: string | null };

/** Two-level cascading select — top-level categories, then that category's sub-categories. Both are Super-Admin-managed; nothing here can be typed freely. */
export function CategorySelect({
  categories,
  name = "categoryId",
  defaultCategoryId,
  required = true,
}: {
  categories: CategoryTreeNode[];
  name?: string;
  defaultCategoryId?: string | null;
  required?: boolean;
}) {
  const topLevel = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const defaultNode = categories.find((c) => c.id === defaultCategoryId);
  const defaultParentId = defaultNode?.parentId ?? defaultNode?.id ?? "";

  const [parentId, setParentId] = useState(defaultParentId);
  const children = useMemo(() => categories.filter((c) => c.parentId === parentId), [categories, parentId]);
  const [childId, setChildId] = useState(defaultNode?.parentId ? defaultNode.id : "");

  const selectedId = children.length > 0 ? childId : parentId;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="categoryId-parent">Kategoriya</Label>
        <Select
          value={parentId}
          onValueChange={(value) => {
            setParentId(value ?? "");
            setChildId("");
          }}
        >
          <SelectTrigger id="categoryId-parent" className="w-full">
            <SelectValue placeholder="Kategoriya tanlang" />
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
      <div className="space-y-2">
        <Label htmlFor="categoryId-child">Sub-kategoriya</Label>
        <Select value={childId} onValueChange={(value) => setChildId(value ?? "")} disabled={children.length === 0}>
          <SelectTrigger id="categoryId-child" className="w-full">
            <SelectValue placeholder={children.length === 0 ? "—" : "Sub-kategoriya tanlang"} />
          </SelectTrigger>
          <SelectContent>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <input type="hidden" name={name} value={selectedId} required={required} />
    </div>
  );
}
