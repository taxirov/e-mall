import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StoreSettingsForm } from "@/components/store-settings-form";

export default async function StoreSettingsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.user.storeId } });

  return (
    <StoreSettingsForm
      initialName={store.name}
      initialDescription={store.description ?? ""}
      initialSlug={store.slug}
    />
  );
}
