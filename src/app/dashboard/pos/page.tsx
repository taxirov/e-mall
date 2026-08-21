import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PosScreen } from "@/components/pos-screen";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.user.storeId } });

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId, stock: { gt: 0 } },
    orderBy: { catalogProduct: { name: "asc" } },
    select: {
      id: true,
      price: true,
      stock: true,
      catalogProduct: { select: { name: true, size: true, categoryId: true, imageUrl: true } },
    },
  });

  return (
    <PosScreen
      storeActive={store.status === "ACTIVE"}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.catalogProduct.size ? `${p.catalogProduct.name}, ${p.catalogProduct.size}` : p.catalogProduct.name,
        price: p.price.toString(),
        stock: p.stock,
        categoryId: p.catalogProduct.categoryId,
        imageUrl: p.catalogProduct.imageUrl,
      }))}
    />
  );
}
