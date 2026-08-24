import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PosScreen } from "@/components/pos-screen";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const store = await prisma.store.findUnique({ where: { id: session.user.storeId } });
  if (!store) redirect("/login");

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId, stock: { gt: 0 } },
    orderBy: { catalogProduct: { name: "asc" } },
    select: {
      id: true,
      price: true,
      stock: true,
      isNew: true,
      discountPrice: true,
      discountEndsAt: true,
      catalogProduct: {
        select: { name: true, size: true, imageUrl: true, barcode: true, category: { select: { id: true, name: true } } },
      },
    },
  });

  const categories = Array.from(
    new Map(products.map((p) => [p.catalogProduct.category.id, p.catalogProduct.category.name])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <PosScreen
      storeActive={store.status === "ACTIVE"}
      categories={categories}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.catalogProduct.size ? `${p.catalogProduct.name}, ${p.catalogProduct.size}` : p.catalogProduct.name,
        price: p.price.toString(),
        stock: p.stock,
        categoryId: p.catalogProduct.category.id,
        imageUrl: p.catalogProduct.imageUrl,
        barcode: p.catalogProduct.barcode,
        isNew: p.isNew,
        discountPrice: p.discountPrice?.toString() ?? null,
        discountEndsAt: p.discountEndsAt?.toISOString() ?? null,
      }))}
    />
  );
}
