import { prisma } from "@/lib/prisma";
import { AdminProductsManager } from "@/components/admin-products-manager";

export default async function AdminProductsPage() {
  const [catalogProducts, categories, attributes] = await Promise.all([
    prisma.catalogProduct.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        createdByStore: { select: { name: true } },
        _count: { select: { products: true } },
        attributeValues: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.productAttribute.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminProductsManager
      categories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
      attributes={attributes.map((a) => ({ id: a.id, name: a.name, type: a.type, options: a.options }))}
      initialProducts={catalogProducts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        unit: p.unit,
        size: p.size,
        barcode: p.barcode,
        description: p.description,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        createdByStoreName: p.createdByStore?.name ?? null,
        storeCount: p._count.products,
        soliqId: p.soliqId,
        soliqPosition: p.soliqPosition,
        soliqBrand: p.soliqBrand,
        mxikCode: p.mxikCode,
        attributeValues: Object.fromEntries(p.attributeValues.map((v) => [v.attributeId, v.value])),
      }))}
    />
  );
}
