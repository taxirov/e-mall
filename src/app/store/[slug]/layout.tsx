import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";
import { ScriptToggle } from "@/components/script-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

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
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="size-6 shrink-0 rounded-full object-cover" />
            ) : (
              <Store className="size-5 shrink-0" />
            )}
            <span className="truncate">{store.name}</span>
          </Link>
          {session?.user?.role === "CUSTOMER" ? (
            <div className="flex shrink-0 items-center gap-2">
              <ScriptToggle className="hidden sm:flex" />
              <ThemeToggle className="hidden sm:flex" />
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
            <div className="flex shrink-0 items-center gap-2">
              <ScriptToggle className="hidden sm:flex" />
              <ThemeToggle className="hidden sm:flex" />
              <Button render={<Link href="/login" />} nativeButton={false} size="sm" variant="outline">
                Kirish
              </Button>
            </div>
          )}
        </div>
      </header>

      {store.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.bannerUrl} alt="" className="h-32 w-full bg-muted object-cover sm:h-48" />
      ) : (
        <div className="h-16 w-full bg-[radial-gradient(ellipse_80%_100%_at_50%_-20%,var(--brand-muted),transparent)] sm:h-20" />
      )}

      <div className="border-b bg-background">
        <div className={cn("mx-auto max-w-5xl px-4 pb-4", store.bannerUrl ? "-mt-8 sm:-mt-10" : "-mt-2")}>
          <div className="flex items-end gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-md sm:size-20">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <Store className="size-7 text-muted-foreground sm:size-8" />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-lg font-bold sm:text-xl">{store.name}</h1>
              {store.description && <p className="line-clamp-1 text-sm text-muted-foreground">{store.description}</p>}
            </div>
          </div>

          {hasProfileInfo && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {store.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-brand" />
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
                  <Clock className="size-3.5 shrink-0 text-brand" />
                  {store.workingHours}
                </span>
              )}
              {store.contactPhone && (
                <a href={`tel:${store.contactPhone}`} className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                  <Phone className="size-3.5 shrink-0 text-brand" />
                  {store.contactPhone}
                </a>
              )}
              {store.instagramUrl && (
                <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                  <ExternalLink className="size-3.5 shrink-0 text-brand" />
                  Instagram
                </a>
              )}
              {store.telegramUrl && (
                <a href={store.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground hover:underline">
                  <ExternalLink className="size-3.5 shrink-0 text-brand" />
                  Telegram
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
