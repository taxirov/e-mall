import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { ProfileTab } from "@/components/settings/profile-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSom, formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Yangi",
  CONFIRMED: "Tasdiqlangan",
  SHIPPED: "Jo'natilgan",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor qilingan",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { fullName: true, phone: true, telegramPhone: true },
    }),
    prisma.order.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { name: true, slug: true } },
        items: { include: { product: { include: { catalogProduct: true } } } },
      },
      take: 50,
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-xl font-semibold">Akkauntim</h1>

          <ProfileTab fullName={user.fullName} phone={user.phone} telegramPhone={user.telegramPhone} />

          <div>
            <h2 className="mb-3 text-lg font-semibold">Buyurtmalarim</h2>
            <div className="space-y-3">
              {orders.map((order) => (
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
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo&apos;q.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
