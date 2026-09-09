import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, ArrowLeft, BadgeCheck, Clock, Star, Info } from "lucide-react";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";
import { ScriptToggle } from "@/components/script-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { InfoBadges, type InfoBadge } from "@/components/info-badges";
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
  // Same page either way (see middleware.ts), but the subdomain should feel
  // like the store's own independent site, while /mall/{slug} is clearly
  // "browsing a store from inside e-mall.uz" — tagged via x-store-view.
  const isSubdomainView = (await headers()).get("x-store-view") !== "path";

  const hasProfileInfo = store.address || store.instagramUrl || store.telegramUrl;

  const infoBadges: InfoBadge[] = [
    ...(store.estimatedDeliveryTime
      ? [{ icon: Clock, colorClassName: "bg-violet-100 text-violet-600", value: store.estimatedDeliveryTime, label: "yetkazish" }]
      : []),
    // No review system exists yet — shown as an explicit "no data" placeholder rather than a fabricated number.
    { icon: Star, colorClassName: "bg-emerald-100 text-emerald-600", value: "– –", label: "reyting" },
    ...(store.workingHours
      ? [{ icon: Info, colorClassName: "bg-sky-100 text-sky-600", value: store.workingHours, label: "ish tartibi" }]
      : []),
  ];

  return (
    <div className={cn("flex min-h-svh flex-col", isSubdomainView && "storefront-independent")}>
      {!isSubdomainView && (
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 bg-brand px-4 py-1.5 text-center text-xs font-medium text-brand-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5 shrink-0" />
          e-mall.uz ichida ko&apos;rilmoqda — barcha do&apos;konlarga qaytish
        </Link>
      )}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-2 sm:px-4">
          <Link
            href="/"
            aria-label="Orqaga"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="flex items-center justify-center gap-1 truncate font-bold">
              <span className="truncate">{store.name}</span>
              {/* This layout already 404s any store that isn't ACTIVE — see the guard above. */}
              <BadgeCheck className="size-4 shrink-0 text-brand" aria-label="Tasdiqlangan do'kon" />
            </p>
          </div>

          {session?.user ? (
            <div className="flex shrink-0 items-center gap-1">
              <ScriptToggle className="hidden sm:flex" />
              <ThemeToggle className="hidden sm:flex" />
              {ONLINE_ORDERING_ENABLED && (
                <Button render={<Link href="/orders" />} nativeButton={false} variant="ghost" size="sm" className="hidden sm:inline-flex">
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
            <div className="flex shrink-0 items-center gap-1">
              <ScriptToggle className="hidden sm:flex" />
              <ThemeToggle className="hidden sm:flex" />
              <Button render={<Link href="/login" />} nativeButton={false} size="sm" variant="outline">
                Kirish
              </Button>
            </div>
          )}
        </div>

        <div className="border-t">
          <div className="mx-auto max-w-5xl">
            <InfoBadges items={infoBadges} />
          </div>
        </div>

        {hasProfileInfo && (
          <div className="border-t px-4 py-2">
            <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
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
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 sm:pb-6">{children}</main>
      <MobileTabBar />
    </div>
  );
}
