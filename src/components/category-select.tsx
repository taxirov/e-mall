"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/searchable-select";

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
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="categoryId-parent">Kategoriya</Label>
        <SearchableSelect
          id="categoryId-parent"
          options={topLevel}
          value={parentId}
          onChange={(id) => {
            setParentId(id);
            setChildId("");
          }}
          placeholder="Kategoriya qidiring..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId-child">Sub-kategoriya</Label>
        <SearchableSelect
          id="categoryId-child"
          options={children}
          value={childId}
          onChange={setChildId}
          placeholder="Sub-kategoriya qidiring..."
          disabled={children.length === 0}
        />
      </div>
      <input type="hidden" name={name} value={selectedId} required={required} />
    </div>
  );
}
