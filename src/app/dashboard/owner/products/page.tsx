import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/product-manager";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const products = await prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, mxikItem: { select: { mxikCode: true } } },
  });

  return (
    <ProductManager
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price.toString(),
        stock: p.stock,
        isPublished: p.isPublished,
        categoryName: p.category?.name ?? null,
        mxikItemId: p.mxikItemId,
        mxikCode: p.mxikItem?.mxikCode ?? null,
        imageUrl: p.images[0] ?? null,
      }))}
    />
  );
}
