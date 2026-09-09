"use client";

import { Search } from "lucide-react";

/** Scrolls to and focuses the page's search input instead of duplicating search UI in the sticky header. */
export function HeaderSearchButton({ targetId = "catalog-search" }: { targetId?: string }) {
  function handleClick() {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement) el.focus();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Qidirish"
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Search className="size-5" />
    </button>
  );
}
