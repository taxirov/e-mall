import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StoreSettingsForm } from "@/components/store-settings-form";

export default async function StoreSettingsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const store = await prisma.store.findUnique({ where: { id: session.user.storeId } });
  if (!store) redirect("/login");

  return (
    <StoreSettingsForm
      initialName={store.name}
      initialDescription={store.description ?? ""}
      initialSlug={store.slug}
      initialLogoUrl={store.logoUrl}
      initialBannerUrl={store.bannerUrl}
      initialAddress={store.address ?? ""}
      initialLocationUrl={store.locationUrl ?? ""}
      initialWorkingHours={store.workingHours ?? ""}
      initialContactPhone={store.contactPhone}
      initialInstagramUrl={store.instagramUrl ?? ""}
      initialTelegramUrl={store.telegramUrl ?? ""}
    />
  );
}
