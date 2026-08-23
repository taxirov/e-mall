import { redirect } from "next/navigation";
import { ShoppingBag, Clock, XCircle, PackageCheck, Wallet, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, computeTrend } from "@/components/stat-card";
import { OrderChannelDonut } from "@/components/order-channel-donut";
import { RevenueBreakdown } from "@/components/revenue-breakdown";
import { OwnerLiveFeed } from "@/components/owner-live-feed";
import { formatSom } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Tasdiqlanishi kutilmoqda",
  ACTIVE: "Faol",
  SUSPENDED: "Bloklangan",
};

function statusCount(groups: { status: string; _count: number }[], status: string): number {
  return groups.find((g) => g.status === status)?._count ?? 0;
}

export default async function OwnerOverviewPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [statusCountsToday, statusCountsYesterday, salesToday, salesYesterday, onlineToday, onlineYesterday, productCount] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], where: { storeId, createdAt: { gte: startOfDay } }, _count: true }),
      prisma.order.groupBy({
        by: ["status"],
        where: { storeId, createdAt: { gte: startOfYesterday, lt: startOfDay } },
        _count: true,
      }),
      prisma.sale.aggregate({ where: { storeId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.sale.aggregate({
        where: { storeId, createdAt: { gte: startOfYesterday, lt: startOfDay } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { storeId, createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { storeId, createdAt: { gte: startOfYesterday, lt: startOfDay }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.count({ where: { storeId } }),
    ]);

  const ordersTodayTotal = statusCountsToday.reduce((sum, g) => sum + g._count, 0);
  const ordersYesterdayTotal = statusCountsYesterday.reduce((sum, g) => sum + g._count, 0);
  const pendingToday = statusCount(statusCountsToday, "PENDING");
  const pendingYesterday = statusCount(statusCountsYesterday, "PENDING");
  const cancelledToday = statusCount(statusCountsToday, "CANCELLED");
  const cancelledYesterday = statusCount(statusCountsYesterday, "CANCELLED");
  const deliveredToday = statusCount(statusCountsToday, "DELIVERED");
  const deliveredYesterday = statusCount(statusCountsYesterday, "DELIVERED");

  const posTodaySum = Number(salesToday._sum.total ?? 0);
  const posYesterdaySum = Number(salesYesterday._sum.total ?? 0);
  const onlineTodaySum = Number(onlineToday._sum.total ?? 0);
  const onlineYesterdaySum = Number(onlineYesterday._sum.total ?? 0);
  const combinedTodaySum = posTodaySum + onlineTodaySum;
  const combinedYesterdaySum = posYesterdaySum + onlineYesterdaySum;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{store.name}</h1>
        <Badge variant={store.status === "ACTIVE" ? "default" : store.status === "SUSPENDED" ? "destructive" : "secondary"}>
          {STATUS_LABEL[store.status]}
        </Badge>
      </div>

      {store.status !== "ACTIVE" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            {store.status === "PENDING"
              ? "Do'koningiz Super Admin tomonidan ko'rib chiqilmoqda. Tasdiqlangach, vitrina va POS to'liq ishlaydi."
              : "Do'koningiz bloklangan. Batafsil ma'lumot uchun platforma administratsiyasiga murojaat qiling."}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold">Monitoring</h2>
        <p className="text-sm text-muted-foreground">Bu yerda faoliyatingizni ko&apos;rishingiz mumkin</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bugungi buyurtmalar"
          value={ordersTodayTotal}
          icon={ShoppingBag}
          iconClassName="bg-brand/10 text-brand"
          trend={computeTrend(ordersTodayTotal, ordersYesterdayTotal)}
          href="/dashboard/owner/orders"
        />
        <StatCard
          label="Kutilayotgan buyurtmalar"
          value={pendingToday}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
          trend={computeTrend(pendingToday, pendingYesterday)}
          href="/dashboard/owner/orders"
        />
        <StatCard
          label="Bekor qilingan buyurtmalar"
          value={cancelledToday}
          icon={XCircle}
          iconClassName="bg-destructive/10 text-destructive"
          trend={computeTrend(cancelledToday, cancelledYesterday)}
          goodDirection="down"
          href="/dashboard/owner/orders"
        />
        <StatCard
          label="Yetkazilgan buyurtmalar"
          value={deliveredToday}
          icon={PackageCheck}
          iconClassName="bg-emerald-100 text-emerald-600"
          trend={computeTrend(deliveredToday, deliveredYesterday)}
          href="/dashboard/owner/orders"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Sof savdo (do'konda)"
          value={`${formatSom(posTodaySum)} so'm`}
          icon={Wallet}
          iconClassName="bg-brand/10 text-brand"
          trend={computeTrend(posTodaySum, posYesterdaySum)}
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
              { label: "Do'konda (POS)", amount: posTodaySum, count: salesToday._count, colorClassName: "bg-brand" },
              { label: "Onlayn buyurtmalar", amount: onlineTodaySum, count: onlineToday._count, colorClassName: "bg-[#93c5fd]" },
            ]}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Mahsulotlar</p>
          <p className="mt-1 text-2xl font-bold">{productCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Bugungi cheklar</p>
          <p className="mt-1 text-2xl font-bold">{salesToday._count}</p>
        </Card>
      </div>

      <OwnerLiveFeed />
    </div>
  );
}
