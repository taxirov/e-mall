import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SalesHistoryManager } from "@/components/sales-history-manager";

export default async function SalesHistoryPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const [store, sales] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { name: true } }),
    prisma.sale.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { fullName: true } },
        items: { include: { product: { include: { catalogProduct: { select: { name: true } } } } } },
      },
    }),
  ]);
  if (!store) redirect("/login");

  return (
    <SalesHistoryManager
      storeName={store.name}
      sales={sales.map((sale) => ({
        id: sale.id,
        receiptNumber: sale.receiptNumber,
        createdAt: sale.createdAt.toISOString(),
        paymentMethod: sale.paymentMethod,
        cashierName: sale.seller.fullName,
        total: sale.total.toString(),
        items: sale.items.map((item) => ({
          name: item.product.catalogProduct.name,
          qty: item.qty,
          price: item.priceAtSale.toString(),
        })),
      }))}
    />
  );
}
