const RADIUS = 60;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Two-segment donut comparing in-store (POS) vs online order counts — hand-rolled SVG, no chart dependency needed for one chart. */
export function OrderChannelDonut({ posCount, onlineCount }: { posCount: number; onlineCount: number }) {
  const total = posCount + onlineCount;
  const posShare = total > 0 ? posCount / total : 0;
  const posPct = Math.round(posShare * 100);
  const onlinePct = total > 0 ? 100 - posPct : 0;
  const posLength = posShare * CIRCUMFERENCE;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 160 160" className="size-36 -rotate-90">
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth={STROKE} />
          {total > 0 && (
            <>
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke="#93c5fd"
                strokeWidth={STROKE}
                strokeDasharray={`${CIRCUMFERENCE - posLength} ${posLength}`}
                strokeDashoffset={-posLength}
                strokeLinecap="round"
              />
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke="var(--brand)"
                strokeWidth={STROKE}
                strokeDasharray={`${posLength} ${CIRCUMFERENCE - posLength}`}
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">buyurtma</p>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full bg-brand" />
          <span className="text-muted-foreground">Do&apos;konda</span>
          <span className="font-semibold">{posPct}%</span>
          <span className="text-xs text-muted-foreground">({posCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full bg-[#93c5fd]" />
          <span className="text-muted-foreground">Onlayn</span>
          <span className="font-semibold">{onlinePct}%</span>
          <span className="text-xs text-muted-foreground">({onlineCount})</span>
        </div>
      </div>
    </div>
  );
}
