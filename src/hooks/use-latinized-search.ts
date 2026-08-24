"use client";

import { useEffect, useRef, useState } from "react";
import { transliterateToLatin } from "@/actions/transliterate";
import { hasCyrillic, normalizeApostrophes } from "@/lib/canonical-name";

const DEBOUNCE_MS = 350;

/**
 * Returns the term to match product names against. Names are stored
 * canonically in Latin (see canonical-name.ts), so a customer typing a
 * search query in Cyrillic would otherwise get zero matches — this
 * debounces and converts Cyrillic queries to Latin before they're used for
 * filtering. Pure-Latin queries (the common case) pass through instantly,
 * no network call.
 */
export function useLatinizedSearch(rawQuery: string): string {
  const [converted, setConverted] = useState<{ source: string; term: string } | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!hasCyrillic(rawQuery)) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const result = await transliterateToLatin(rawQuery);
      if (requestId.current !== id) return;
      setConverted({ source: rawQuery, term: result.ok ? normalizeApostrophes(result.data) : rawQuery });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  if (!hasCyrillic(rawQuery)) return rawQuery;
  // Still awaiting (or debouncing) the conversion — match everything rather
  // than the raw Cyrillic text, so results don't flash to empty mid-type.
  return converted?.source === rawQuery ? converted.term : "";
}
