import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { appOrigin } from "@/lib/domain";
import { fetchActiveCafes } from "@/lib/ecafe";
import { DiscoveryGrid, type DiscoveryItem } from "@/components/discovery-grid";
import { Store as StoreIcon } from "lucide-react";

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";
  const appUrl = appOrigin(host);

  const [stores, cafes] = await Promise.all([
    prisma.store.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
        servicePolygon: true,
      },
      take: 60,
    }),
    fetchActiveCafes(),
  ]);

  const storeItems: DiscoveryItem[] = stores.map((store) => ({
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logoUrl: store.logoUrl,
    bannerUrl: store.bannerUrl,
    latitude: store.latitude,
    longitude: store.longitude,
    serviceRadiusKm: store.serviceRadiusKm,
    servicePolygon: store.servicePolygon as { lat: number; lng: number }[] | null,
    href: `/mall/${store.slug}`,
  }));
  const cafeItems: DiscoveryItem[] = cafes.map((cafe) => ({
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    logoUrl: cafe.logoUrl,
    bannerUrl: cafe.bannerUrl,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    serviceRadiusKm: cafe.serviceRadiusKm,
    servicePolygon: cafe.servicePolygon,
    href: `/cafe/${cafe.slug}`,
  }));

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1 px-4 pt-4 pb-10">
        <div className="mx-auto max-w-7xl">
          {storeItems.length === 0 && cafeItems.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed px-4 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                <StoreIcon className="size-6" />
              </div>
              <div>
                <p className="font-semibold">Hozircha faol do&apos;konlar yo&apos;q</p>
                <p className="mt-1 text-sm text-muted-foreground">Birinchi bo&apos;lib do&apos;kon oching va shu yerda ko&apos;ring.</p>
              </div>
              <Button render={<Link href={`${appUrl}/register`} />} nativeButton={false}>
                Do&apos;kon ochish
              </Button>
            </div>
          ) : (
            <DiscoveryGrid stores={storeItems} cafes={cafeItems} />
          )}
        </div>
      </main>
    </div>
  );
}
