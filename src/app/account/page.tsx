import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ProfileTab } from "@/components/settings/profile-tab";
import { Receipt, Heart, ChevronRight } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, phone: true, telegramPhone: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-24 sm:pb-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-xl font-semibold">Akkauntim</h1>

          <ProfileTab fullName={user.fullName} phone={user.phone} telegramPhone={user.telegramPhone} />

          <div className="overflow-hidden rounded-2xl border">
            <Link href="/orders" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted">
              <Receipt className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Buyurtmalarim</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <div className="border-t" />
            <Link href="/favorites" className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted">
              <Heart className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Sevimlilar</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
