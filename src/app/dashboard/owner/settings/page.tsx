import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OwnerSettings } from "@/components/owner-settings";

export default async function StoreSettingsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const [store, user] = await Promise.all([
    prisma.store.findUnique({ where: { id: session.user.storeId } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { fullName: true, phone: true, telegramPhone: true } }),
  ]);
  if (!store || !user) redirect("/login");

  return (
    <OwnerSettings
      userFullName={user.fullName}
      userPhone={user.phone}
      userTelegramPhone={user.telegramPhone}
      storeName={store.name}
      storeDescription={store.description ?? ""}
      storeSlug={store.slug}
      storeLogoUrl={store.logoUrl}
      storeBannerUrl={store.bannerUrl}
      storeAddress={store.address ?? ""}
      storeLatitude={store.latitude}
      storeLongitude={store.longitude}
      storeServiceRadiusKm={store.serviceRadiusKm}
      storeServicePolygon={store.servicePolygon as { lat: number; lng: number }[] | null}
      storeLocationUrl={store.locationUrl ?? ""}
      storeWorkingHours={store.workingHours ?? ""}
      storeContactPhone={store.contactPhone}
      storeInstagramUrl={store.instagramUrl ?? ""}
      storeTelegramUrl={store.telegramUrl ?? ""}
      storeUseEcourier={store.useEcourier}
    />
  );
}
