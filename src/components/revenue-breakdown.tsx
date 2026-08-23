import { formatSom } from "@/lib/format";

type Channel = { label: string; amount: number; count: number; colorClassName: string };

export function RevenueBreakdown({ totalAmount, channels }: { totalAmount: number; channels: Channel[] }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Taxminiy jami daromad</p>
        <p className="text-2xl font-bold">{formatSom(totalAmount)} so&apos;m</p>
      </div>
      <div className="space-y-4">
        {channels.map((channel) => {
          const pct = totalAmount > 0 ? Math.min(100, Math.round((channel.amount / totalAmount) * 100)) : 0;
          return (
            <div key={channel.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{channel.label}</span>
                <span className="font-semibold">{formatSom(channel.amount)} so&apos;m</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${channel.colorClassName}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{channel.count} buyurtma</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
