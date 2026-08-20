import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROOT_DOMAIN } from "@/lib/domain";
import { Store as StoreIcon } from "lucide-react";

export default async function HomePage() {
  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, description: true, logoUrl: true },
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <section className="border-b bg-muted/30 px-4 py-10 text-center sm:py-16">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          O&apos;zbekistondagi do&apos;konlar bir joyda
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Do&apos;kon oching, mahsulotlaringizni onlayn soting va do&apos;konda POS orqali savdo qiling —
          barchasi bitta platformada.
        </p>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold">Faol do&apos;konlar</h2>

        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hozircha faol do&apos;konlar yo&apos;q.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {stores.map((store) => (
              <Link key={store.id} href={`https://${store.slug}.${ROOT_DOMAIN}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                    <StoreIcon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{store.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {store.description ?? "Do'kon tavsifi kiritilmagan"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
