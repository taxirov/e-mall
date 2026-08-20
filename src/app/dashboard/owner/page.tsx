import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OwnerLiveFeed } from "@/components/owner-live-feed";
import { formatSom } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Tasdiqlanishi kutilmoqda",
  ACTIVE: "Faol",
  SUSPENDED: "Bloklangan",
};

export default async function OwnerOverviewPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaySales, productCount, pendingOrders] = await Promise.all([
    prisma.sale.aggregate({
      where: { storeId, createdAt: { gte: startOfDay } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { storeId } }),
    prisma.order.count({ where: { storeId, status: "PENDING" } }),
  ]);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bugungi savdo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatSom(Number(todaySales._sum.total ?? 0))} so&apos;m
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bugungi cheklar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{todaySales._count}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{productCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kutilayotgan buyurtmalar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{pendingOrders}</CardContent>
        </Card>
      </div>

      <OwnerLiveFeed />
    </div>
  );
}
