import { prisma } from "@/lib/prisma";
import { StorefrontCatalog } from "@/components/storefront-catalog";

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });

  const products = await prisma.product.findMany({
    where: { storeId: store.id, isPublished: true, stock: { gt: 0 } },
    orderBy: { catalogProduct: { name: "asc" } },
    select: {
      id: true,
      price: true,
      stock: true,
      catalogProduct: { select: { name: true, size: true, imageUrl: true, category: true } },
    },
  });

  const categoriesById = new Map<string, { id: string; name: string }>();
  for (const p of products) {
    const c = p.catalogProduct.category;
    if (!categoriesById.has(c.id)) categoriesById.set(c.id, { id: c.id, name: c.name });
  }

  return (
    <StorefrontCatalog
      storeSlug={slug}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.catalogProduct.size ? `${p.catalogProduct.name}, ${p.catalogProduct.size}` : p.catalogProduct.name,
        price: p.price.toString(),
        stock: p.stock,
        categoryId: p.catalogProduct.category.id,
        imageUrl: p.catalogProduct.imageUrl,
      }))}
      categories={Array.from(categoriesById.values()).sort((a, b) => a.name.localeCompare(b.name))}
    />
  );
}
