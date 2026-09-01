import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { FavoritesList, type FavoriteProduct } from "@/components/favorites-list";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { catalogProduct: true, store: { select: { name: true, slug: true } } },
      },
    },
  });

  const items: FavoriteProduct[] = favorites.map((f) => ({
    productId: f.product.id,
    name: f.product.catalogProduct.name,
    imageUrl: f.product.catalogProduct.imageUrl,
    price: f.product.price.toString(),
    discountPrice: f.product.discountPrice?.toString() ?? null,
    discountEndsAt: f.product.discountEndsAt?.toISOString() ?? null,
    storeName: f.product.store.name,
    storeSlug: f.product.store.slug,
  }));

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-xl font-semibold">Sevimlilar</h1>
          <FavoritesList initialItems={items} />
        </div>
      </main>
    </div>
  );
}
