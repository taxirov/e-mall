import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderManager } from "@/components/order-manager";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { fullName: true, phone: true } },
      items: { include: { product: { select: { catalogProduct: { select: { name: true } } } } } },
    },
  });

  return (
    <OrderManager
      initialOrders={orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total.toString(),
        address: o.address,
        phone: o.phone,
        note: o.note,
        createdAt: o.createdAt.toISOString(),
        customerName: o.customer.fullName,
        customerPhone: o.customer.phone,
        courierStatus: o.courierStatus,
        courierName: o.courierName,
        courierPhone: o.courierPhone,
        items: o.items.map((i) => ({ name: i.product.catalogProduct.name, qty: i.qty, price: i.priceAtOrder.toString() })),
      }))}
    />
  );
}
