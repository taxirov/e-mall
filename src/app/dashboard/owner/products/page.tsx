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
      include: { catalogProduct: { include: { category: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ProductManager
      storeId={storeId}
      categories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
      initialProducts={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        price: p.price.toString(),
        costPrice: p.costPrice?.toString() ?? null,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        expiryDate: p.expiryDate?.toISOString() ?? null,
        isPublished: p.isPublished,
        catalogProduct: {
          id: p.catalogProduct.id,
          name: p.catalogProduct.name,
          brand: p.catalogProduct.brand,
          unit: p.catalogProduct.unit,
          size: p.catalogProduct.size,
          barcode: p.catalogProduct.barcode,
          description: p.catalogProduct.description,
          imageUrl: p.catalogProduct.imageUrl,
          categoryId: p.catalogProduct.categoryId,
          categoryName: p.catalogProduct.category.name,
          createdByStoreId: p.catalogProduct.createdByStoreId,
        },
      }))}
    />
  );
}
