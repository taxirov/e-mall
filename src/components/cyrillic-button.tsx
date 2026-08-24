"use client";

import { useTransition } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { transliterateToCyrillic } from "@/actions/transliterate";

/** Drop next to any text input — converts its current value to Uzbek Cyrillic and hands the result back via onConverted. */
export function CyrillicButton({ text, onConverted }: { text: string; onConverted: (cyrillic: string) => void }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await transliterateToCyrillic(text);
      if (result.ok) onConverted(result.data);
      else toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!text.trim() || pending}
      onClick={handleClick}
      title="Krilchaga o'tkazish"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
    </Button>
  );
}
