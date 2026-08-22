"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export type StoreTypeOption = { id: string; name: string };

/** Search-to-filter, checkbox-to-pick multi-select for store types — replaces a long always-visible checkbox list. */
export function StoreTypeMultiSelect({
  storeTypes,
  name = "storeTypeIds",
}: {
  storeTypes: StoreTypeOption[];
  name?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside (rather than input onBlur) so clicking a checkbox inside
  // the dropdown — which shifts focus to it — doesn't itself close the list.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return storeTypes;
    return storeTypes.filter((t) => t.name.toLowerCase().includes(q));
  }, [storeTypes, query]);

  const selectedTypes = useMemo(
    () => storeTypes.filter((t) => selected.includes(t.id)),
    [storeTypes, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (storeTypes.length === 0) {
    return <p className="text-xs text-muted-foreground">Hozircha do&apos;kon turlari yo&apos;q</p>;
  }

  return (
    <div className="space-y-2">
      {selectedTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTypes.map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
              {t.name}
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
                aria-label={`${t.name} ni olib tashlash`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <Input
          placeholder="Do'kon turini qidiring..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Hech narsa topilmadi</p>
            )}
            {filtered.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        )}
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
