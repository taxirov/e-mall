import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { appOrigin } from "@/lib/domain";

export async function SiteHeader() {
  const session = await auth();
  const host = (await headers()).get("host") ?? "";
  const appUrl = appOrigin(host);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/logo-96.png" alt="" width={28} height={28} className="rounded-md" priority />
          e-mall.uz
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2">
            <Button render={<Link href={`${appUrl}${dashboardPathFor(session.user.role)}`} />} nativeButton={false} variant="ghost" size="sm">
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
            <Button render={<Link href={`${appUrl}/login`} />} nativeButton={false} variant="ghost" size="sm">
              Kirish
            </Button>
            <Button render={<Link href={`${appUrl}/register`} />} nativeButton={false} size="sm">
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
