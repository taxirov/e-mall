import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SalesHistoryManager } from "@/components/sales-history-manager";

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;
  const { from, to } = await searchParams;

  const createdAt: { gte?: Date; lt?: Date } = {};
  if (from) createdAt.gte = new Date(`${from}T00:00:00`);
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    createdAt.lt = end;
  }

  const [store, sales] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { name: true } }),
    prisma.sale.findMany({
      where: { storeId, ...(from || to ? { createdAt } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { fullName: true } },
        coupon: { select: { code: true } },
        items: { include: { product: { include: { catalogProduct: { select: { name: true } } } } } },
        returns: { include: { items: true } },
      },
    }),
  ]);
  if (!store) redirect("/login");

  return (
    <SalesHistoryManager
      storeName={store.name}
      initialFrom={from ?? ""}
      initialTo={to ?? ""}
      sales={sales.map((sale) => {
        const returnedAmount = sale.returns.reduce((sum, r) => sum + Number(r.amount), 0);
        const returnedQtyBySaleItem = new Map<string, number>();
        for (const ret of sale.returns) {
          for (const item of ret.items) {
            returnedQtyBySaleItem.set(item.saleItemId, (returnedQtyBySaleItem.get(item.saleItemId) ?? 0) + item.qty);
          }
        }
        return {
          id: sale.id,
          receiptNumber: sale.receiptNumber,
          createdAt: sale.createdAt.toISOString(),
          paymentMethod: sale.paymentMethod,
          cashierName: sale.seller.fullName,
          total: sale.total.toString(),
          discountAmount: sale.discountAmount.toString(),
          couponCode: sale.coupon?.code ?? null,
          returnedAmount,
          items: sale.items.map((item) => ({
            saleItemId: item.id,
            name: item.product.catalogProduct.name,
            qty: item.qty,
            price: item.priceAtSale.toString(),
            returnedQty: returnedQtyBySaleItem.get(item.id) ?? 0,
          })),
        };
      })}
    />
  );
}
