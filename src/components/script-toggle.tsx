"use client";

import { useScript } from "@/contexts/script-context";
import { cn } from "@/lib/utils";

/** The label text is the script name itself, so it must never be transliterated by ScriptTransliterator. */
export function ScriptToggle({ className }: { className?: string }) {
  const { script, toggleScript } = useScript();

  return (
    <div
      data-no-transliterate
      className={cn("flex items-center rounded-full border p-0.5 text-xs font-medium", className)}
    >
      <button
        type="button"
        onClick={() => script !== "latin" && toggleScript()}
        className={cn("rounded-full px-2.5 py-1 transition-colors", script === "latin" ? "bg-brand text-brand-foreground" : "text-muted-foreground")}
      >
        O&apos;zbek
      </button>
      <button
        type="button"
        onClick={() => script !== "cyrillic" && toggleScript()}
        className={cn("rounded-full px-2.5 py-1 transition-colors", script === "cyrillic" ? "bg-brand text-brand-foreground" : "text-muted-foreground")}
      >
        Ўзбек
      </button>
    </div>
  );
}
