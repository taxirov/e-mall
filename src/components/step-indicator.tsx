import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ step, labels }: { step: number; labels: [string, string] }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done || active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </div>
            <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < labels.length && <div className={cn("h-px flex-1", done ? "bg-brand" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}
