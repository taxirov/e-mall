"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { searchCatalogProducts, type CatalogProductSearchResult } from "@/actions/catalog-products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Search-and-select for the shared product catalog — stores pick from what
 * already exists instead of re-creating duplicates. If nothing matches, a
 * "create new" affordance hands off to the caller (which reveals the
 * new-catalog-product form fields).
 */
export function CatalogProductPicker({
  onSelect,
  onCreateNew,
  placeholder = "Mahsulot nomi, brendi yoki shtrix-kodi bo'yicha qidiring...",
}: {
  onSelect: (item: CatalogProductSearchResult) => void;
  onCreateNew: () => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const items = await searchCatalogProducts(query);
      if (!cancelled) {
        setResults(items);
        setLoading(false);
        setOpen(true);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor="catalog-product-search">Mahsulot (umumiy katalogdan)</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="catalog-product-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (results.length > 0 || query.trim().length >= 2) && setOpen(true)}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {loading && <p className="px-3 py-2 text-sm text-muted-foreground">Qidirilmoqda...</p>}
          {!loading &&
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  skipNextSearch.current = true;
                  setQuery(item.name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
              >
                <div className="size-9 shrink-0 overflow-hidden rounded bg-muted">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.brand ? `${item.brand} — ` : ""}
                    {item.name}
                    {item.size ? `, ${item.size}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.categoryName}
                    {item.barcode ? ` · ${item.barcode}` : ""}
                  </p>
                </div>
              </button>
            ))}
          {!loading && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreateNew();
              }}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
            >
              <Plus className="size-4" /> Yangi mahsulot yaratish
            </button>
          )}
        </div>
      )}
      {!open && (
        <Button type="button" variant="outline" size="sm" onClick={onCreateNew}>
          <Plus className="size-4" /> Yangi mahsulot yaratish
        </Button>
      )}
    </div>
  );
}
