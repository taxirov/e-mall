import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Button } from "@/components/ui/button";
import { appOrigin } from "@/lib/domain";
import { fetchActiveCafes } from "@/lib/ecafe";
import { DiscoveryGrid, type DiscoveryItem } from "@/components/discovery-grid";
import { Store as StoreIcon, Sparkles, Truck, ShieldCheck, Wallet } from "lucide-react";

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

      <main className="flex-1 pb-24 sm:pb-10">
        <section className="px-4 pt-4">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand to-indigo-950 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-10 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
                <Sparkles className="size-3.5" />
                Yangi avlod savdo maydonchasi
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                Shahringizdagi eng yaxshi do&apos;konlar va kafelar — bir joyda
              </h1>
              <p className="mt-4 text-base text-white/85 sm:text-lg">
                Yoningizdagi do&apos;kon va kafelarni toping, sevimlilaringizni saqlang, onlayn buyurtma bering.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Button render={<Link href={`${appUrl}/register`} />} nativeButton={false} size="lg" className="bg-white text-brand hover:bg-white/90">
                  Do&apos;kon ochish
                </Button>
                <Button
                  render={<Link href="#discover" />}
                  nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  Do&apos;konlarni ko&apos;rish
                </Button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <Truck className="size-4 shrink-0" /> Tez yetkazib berish
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" /> Ishonchli do&apos;konlar
                </span>
                <span className="flex items-center gap-2">
                  <Wallet className="size-4 shrink-0" /> Qulay to&apos;lov
                </span>
              </div>
            </div>
          </div>
        </section>

        <div id="discover" className="px-4 pt-6">
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
        </div>
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
