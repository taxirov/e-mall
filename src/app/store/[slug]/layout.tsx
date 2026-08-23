import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || store.status !== "ACTIVE") notFound();

  const session = await auth();

  const hasProfileInfo =
    store.address || store.workingHours || store.contactPhone || store.instagramUrl || store.telegramUrl;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="size-7 rounded-full object-cover" />
            ) : (
              <Store className="size-5" />
            )}
            {store.name}
          </Link>
          {session?.user?.role === "CUSTOMER" ? (
            <div className="flex items-center gap-2">
              {ONLINE_ORDERING_ENABLED && (
                <Button render={<Link href="/orders" />} nativeButton={false} variant="ghost" size="sm">
                  Buyurtmalarim
                </Button>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button size="sm" variant="outline" type="submit">
                  Chiqish
                </Button>
              </form>
            </div>
          ) : (
            <Button render={<Link href="/login" />} nativeButton={false} size="sm" variant="outline">
              Kirish
            </Button>
          )}
        </div>
      </header>

      {store.bannerUrl && (
        <div className="h-32 w-full overflow-hidden bg-muted sm:h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={store.bannerUrl} alt="" className="size-full object-cover" />
        </div>
      )}

      {(store.description || hasProfileInfo) && (
        <div className="border-b bg-muted/20">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-4">
            {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}
            {hasProfileInfo && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {store.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {store.locationUrl ? (
                      <a href={store.locationUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
                        {store.address}
                      </a>
                    ) : (
                      store.address
                    )}
                  </span>
                )}
                {store.workingHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0" />
                    {store.workingHours}
                  </span>
                )}
                {store.contactPhone && (
                  <a href={`tel:${store.contactPhone}`} className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                    <Phone className="size-3.5 shrink-0" />
                    {store.contactPhone}
                  </a>
                )}
                {store.instagramUrl && (
                  <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                    <ExternalLink className="size-3.5 shrink-0" />
                    Instagram
                  </a>
                )}
                {store.telegramUrl && (
                  <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                    <ExternalLink className="size-3.5 shrink-0" />
                    Telegram
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
