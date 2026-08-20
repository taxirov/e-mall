import { prisma } from "@/lib/prisma";
import { StorefrontCatalog } from "@/components/storefront-catalog";

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, isPublished: true, stock: { gt: 0 } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, price: true, stock: true, categoryId: true, images: true },
    }),
    prisma.category.findMany({ where: { storeId: store.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <StorefrontCatalog
      storeSlug={slug}
      initialProducts={products.map((p) => ({ ...p, price: p.price.toString() }))}
      categories={categories}
    />
  );
}
