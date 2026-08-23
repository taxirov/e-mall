import Link from "next/link";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTrend = { direction: "up" | "down" | "flat" | "new"; percent: number };

/** Compares today's count against yesterday's. `goodDirection` flips the color for metrics where "up" is bad (e.g. cancellations). */
export function computeTrend(today: number, yesterday: number): StatTrend {
  if (yesterday === 0) {
    if (today === 0) return { direction: "flat", percent: 0 };
    return { direction: "new", percent: 100 };
  }
  const diff = ((today - yesterday) / yesterday) * 100;
  if (Math.round(diff) === 0) return { direction: "flat", percent: 0 };
  return { direction: diff > 0 ? "up" : "down", percent: Math.round(Math.abs(diff)) };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  trend,
  goodDirection = "up",
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  trend?: StatTrend;
  goodDirection?: "up" | "down";
  href?: string;
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend && <TrendLine trend={trend} goodDirection={goodDirection} />}
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-sm font-medium text-brand hover:underline">
          Batafsil <ChevronRight className="size-3.5" />
        </Link>
      )}
    </Card>
  );
}

function TrendLine({ trend, goodDirection }: { trend: StatTrend; goodDirection: "up" | "down" }) {
  if (trend.direction === "flat") {
    return <p className="text-xs text-muted-foreground">Kecha bilan bir xil</p>;
  }
  if (trend.direction === "new") {
    return <p className="text-xs font-medium text-brand">Bugun birinchi marta</p>;
  }
  const isGood = trend.direction === goodDirection;
  const Icon = trend.direction === "up" ? TrendingUp : TrendingDown;
  return (
    <p className={cn("flex items-center gap-1 text-xs font-medium", isGood ? "text-emerald-600" : "text-destructive")}>
      <Icon className="size-3.5" />
      {trend.percent}% kechagiga nisbatan
    </p>
  );
}
