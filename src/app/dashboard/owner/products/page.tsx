import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/product-manager";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");
  const storeId = session.user.storeId;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } }, mxikItem: { select: { mxikCode: true } } },
    }),
    prisma.category.findMany({ where: { storeId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ProductManager
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price.toString(),
        stock: p.stock,
        isPublished: p.isPublished,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        mxikItemId: p.mxikItemId,
        mxikCode: p.mxikItem?.mxikCode ?? null,
      }))}
      initialCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
