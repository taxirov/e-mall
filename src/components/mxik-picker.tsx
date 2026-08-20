"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchMxikItems, type MxikSearchResult } from "@/actions/mxik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Search-and-select for the national goods classifier (MXIK/soliq.uz) —
 * store owners pick products from here instead of typing free-text names,
 * so every product is fiscal/e-invoicing-ready by construction.
 */
export function MxikPicker({
  onSelect,
  placeholder = "Mahsulot nomi yoki MXIK kodi bo'yicha qidiring...",
}: {
  onSelect: (item: MxikSearchResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MxikSearchResult[]>([]);
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
      const items = await searchMxikItems(query);
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
      <Label htmlFor="mxik-search">Mahsulot (soliq.uz ro&apos;yxatidan)</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="mxik-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {loading && <p className="px-3 py-2 text-sm text-muted-foreground">Qidirilmoqda...</p>}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Hech narsa topilmadi</p>
          )}
          {!loading &&
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  skipNextSearch.current = true;
                  setQuery(item.mxikName);
                  setOpen(false);
                }}
                className="block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
              >
                <p className="line-clamp-2 font-medium">{item.mxikName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.mxikCode}
                  {item.groupName ? ` · ${item.groupName}` : ""}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
