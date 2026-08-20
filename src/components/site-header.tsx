import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Store className="size-5" />
          e-mall.uz
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2">
            <Button render={<Link href={dashboardPathFor(session.user.role)} />} nativeButton={false} variant="ghost" size="sm">
              Boshqaruv paneli
            </Button>
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
          <div className="flex items-center gap-2">
            <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
              Kirish
            </Button>
            <Button render={<Link href="/register" />} nativeButton={false} size="sm">
              Do&apos;kon ochish
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function dashboardPathFor(role: string) {
  if (role === "SUPER_ADMIN") return "/dashboard/admin";
  if (role === "OWNER") return "/dashboard/owner";
  if (role === "SELLER") return "/dashboard/pos";
  return "/";
}
