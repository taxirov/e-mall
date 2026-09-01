import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { formatSom, formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Yangi",
  CONFIRMED: "Tasdiqlangan",
  SHIPPED: "Jo'natilgan",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor qilingan",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true, slug: true } },
      items: { include: { product: { include: { catalogProduct: true } } } },
    },
    take: 50,
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-24 sm:pb-10">
        <div className="mx-auto max-w-2xl space-y-3">
          <h1 className="text-xl font-semibold">Buyurtmalar</h1>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-4 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-6" />
              </div>
              <div>
                <p className="font-semibold">Buyurtmalaringiz ro&apos;yxati</p>
                <p className="mt-1 text-sm text-muted-foreground">Bu yerda siz bergan buyurtmalar chiqadi.</p>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm">{order.store.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <Badge
                    variant={
                      order.status === "CANCELLED" ? "destructive" : order.status === "DELIVERED" ? "default" : "secondary"
                    }
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="mb-2 text-sm text-muted-foreground">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.product.catalogProduct.name} × {item.qty}
                      </li>
                    ))}
                  </ul>
                  <p className="font-semibold">{formatSom(order.total.toString())} so&apos;m</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
