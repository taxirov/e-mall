import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoBadge = {
  icon: LucideIcon;
  colorClassName: string;
  value: string;
  label: string;
};

/** Uzum-Tezkor-style row of circular icon badges (delivery time, rating, delivery fee, hours) shown under a store/cafe's name. */
export function InfoBadges({ items }: { items: InfoBadge[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-5 px-4 py-3 sm:justify-start sm:gap-8">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 text-center">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", item.colorClassName)}>
            <item.icon className="size-4" />
          </span>
          <div>
            <p className="truncate text-xs font-semibold">{item.value}</p>
            <p className="truncate text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
