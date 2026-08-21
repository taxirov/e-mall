import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WarehouseManager } from "@/components/warehouse-manager";

export default async function WarehousePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const [products, receipts] = await Promise.all([
    prisma.product.findMany({
      where: { storeId },
      orderBy: { catalogProduct: { name: "asc" } },
      select: { id: true, stock: true, price: true, costPrice: true, expiryDate: true, catalogProduct: { select: { name: true, size: true } } },
    }),
    prisma.stockReceipt.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { catalogProduct: { select: { name: true, size: true } } } }, receivedBy: { select: { fullName: true } } },
    }),
  ]);

  function displayName(catalogProduct: { name: string; size: string | null }) {
    return catalogProduct.size ? `${catalogProduct.name}, ${catalogProduct.size}` : catalogProduct.name;
  }

  return (
    <WarehouseManager
      products={products.map((p) => ({
        id: p.id,
        name: displayName(p.catalogProduct),
        stock: p.stock,
        price: p.price.toString(),
        costPrice: p.costPrice?.toString() ?? null,
        expiryDate: p.expiryDate?.toISOString() ?? null,
      }))}
      receipts={receipts.map((r) => ({
        id: r.id,
        productName: displayName(r.product.catalogProduct),
        quantity: r.quantity,
        costPrice: r.costPrice.toString(),
        sellingPrice: r.sellingPrice.toString(),
        expiryDate: r.expiryDate?.toISOString() ?? null,
        supplier: r.supplier,
        receivedByName: r.receivedBy.fullName,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
