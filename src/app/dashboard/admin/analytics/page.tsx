import { Store as StoreIcon, Clock, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatCard, computeTrend } from "@/components/stat-card";
import { OrderChannelDonut } from "@/components/order-channel-donut";
import { RevenueBreakdown } from "@/components/revenue-breakdown";
import { formatSom } from "@/lib/format";

function countFor(groups: { status?: string; role?: string; _count: number }[], key: string): number {
  return groups.find((g) => g.status === key || g.role === key)?._count ?? 0;
}

export default async function AdminAnalyticsPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [
    storeStatusCounts,
    userRoleCounts,
    salesToday,
    salesYesterday,
    onlineToday,
    onlineYesterday,
    ordersTodayByStatus,
    ordersYesterdayByStatus,
    salesByStoreToday,
    ordersByStoreToday,
  ] = await Promise.all([
    prisma.store.groupBy({ by: ["status"], _count: true }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.sale.aggregate({ where: { createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfYesterday, lt: startOfDay } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfYesterday, lt: startOfDay }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: startOfDay } }, _count: true }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startOfYesterday, lt: startOfDay } },
      _count: true,
    }),
    prisma.sale.groupBy({ by: ["storeId"], where: { createdAt: { gte: startOfDay } }, _sum: { total: true } }),
    prisma.order.groupBy({
      by: ["storeId"],
      where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);

  const activeStores = countFor(storeStatusCounts, "ACTIVE");
  const pendingStores = countFor(storeStatusCounts, "PENDING");
  const totalStores = storeStatusCounts.reduce((sum, g) => sum + g._count, 0);

  const totalOwners = countFor(userRoleCounts, "OWNER");
  const totalCustomers = countFor(userRoleCounts, "CUSTOMER");

  const posTodaySum = Number(salesToday._sum.total ?? 0);
  const posYesterdaySum = Number(salesYesterday._sum.total ?? 0);
  const onlineTodaySum = Number(onlineToday._sum.total ?? 0);
  const onlineYesterdaySum = Number(onlineYesterday._sum.total ?? 0);
  const combinedTodaySum = posTodaySum + onlineTodaySum;
  const combinedYesterdaySum = posYesterdaySum + onlineYesterdaySum;

  const ordersTodayTotal = ordersTodayByStatus.reduce((sum, g) => sum + g._count, 0);
  const ordersYesterdayTotal = ordersYesterdayByStatus.reduce((sum, g) => sum + g._count, 0);
  const pendingOrdersToday = countFor(ordersTodayByStatus, "PENDING");
  const pendingOrdersYesterday = countFor(ordersYesterdayByStatus, "PENDING");

  const revenueByStore = new Map<string, number>();
  for (const row of salesByStoreToday) {
    revenueByStore.set(row.storeId, (revenueByStore.get(row.storeId) ?? 0) + Number(row._sum.total ?? 0));
  }
  for (const row of ordersByStoreToday) {
    revenueByStore.set(row.storeId, (revenueByStore.get(row.storeId) ?? 0) + Number(row._sum.total ?? 0));
  }
  const topStoreIds = Array.from(revenueByStore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([storeId]) => storeId);
  const topStores = await prisma.store.findMany({
    where: { id: { in: topStoreIds } },
    select: { id: true, name: true },
  });
  const topStoresRanked = topStoreIds
    .map((id) => ({ name: topStores.find((s) => s.id === id)?.name ?? "—", revenue: revenueByStore.get(id) ?? 0 }))
    .filter((s) => s.revenue > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analitika</h1>
        <p className="text-sm text-muted-foreground">Platforma bo&apos;ylab bugungi ko&apos;rsatkichlar</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Faol do'konlar"
          value={`${activeStores} / ${totalStores}`}
          icon={StoreIcon}
          iconClassName="bg-brand/10 text-brand"
          href="/dashboard/admin"
        />
        <StatCard
          label="Tasdiqlanishi kutilmoqda"
          value={pendingStores}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
          href="/dashboard/admin"
        />
        <StatCard label="Do'kon egalari" value={totalOwners} icon={ShieldCheck} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard label="Xaridorlar" value={totalCustomers} icon={Users} iconClassName="bg-brand/10 text-brand" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Bugungi buyurtmalar"
          value={ordersTodayTotal}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
          trend={computeTrend(ordersTodayTotal, ordersYesterdayTotal)}
        />
        <StatCard
          label="Kutilayotgan buyurtmalar"
          value={pendingOrdersToday}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
          trend={computeTrend(pendingOrdersToday, pendingOrdersYesterday)}
        />
        <StatCard
          label="Jami savdo (barcha kanallar)"
          value={`${formatSom(combinedTodaySum)} so'm`}
          icon={TrendingUp}
          iconClassName="bg-emerald-100 text-emerald-600"
          trend={computeTrend(combinedTodaySum, combinedYesterdaySum)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-4 font-medium">Buyurtmalar taqsimoti</p>
          <OrderChannelDonut posCount={salesToday._count} onlineCount={onlineToday._count} />
        </Card>
        <Card className="p-5">
          <p className="mb-4 font-medium">Barcha daromad</p>
          <RevenueBreakdown
            totalAmount={combinedTodaySum}
            channels={[
              { label: "Do'konlarda (POS)", amount: posTodaySum, count: salesToday._count, colorClassName: "bg-brand" },
              { label: "Onlayn buyurtmalar", amount: onlineTodaySum, count: onlineToday._count, colorClassName: "bg-[#93c5fd]" },
            ]}
          />
        </Card>
      </div>

      <Card className="p-5">
        <p className="mb-4 font-medium">Bugungi eng faol do&apos;konlar</p>
        {topStoresRanked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bugun hali savdo bo&apos;lgani yo&apos;q.</p>
        ) : (
          <div className="space-y-3">
            {topStoresRanked.map((store, i) => (
              <div key={store.name + i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {i + 1}
                  </span>
                  {store.name}
                </span>
                <span className="font-semibold">{formatSom(store.revenue)} so&apos;m</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
