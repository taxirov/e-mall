import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
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

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Store className="size-5" />
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
