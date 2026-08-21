import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

export default async function CustomerOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") redirect(`/login?callbackUrl=/orders`);

  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });
  const orders = await prisma.order.findMany({
    where: { storeId: store.id, customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { catalogProduct: { select: { name: true } } } } } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Buyurtmalarim</h1>
      <div className="grid gap-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </CardTitle>
              <Badge variant={order.status === "CANCELLED" ? "destructive" : order.status === "DELIVERED" ? "default" : "secondary"}>
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
              <p className="font-semibold">{formatSom(Number(order.total))} so&apos;m</p>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo&apos;q.</p>}
      </div>
    </div>
  );
}
