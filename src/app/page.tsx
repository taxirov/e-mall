import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ROOT_DOMAIN, appOrigin } from "@/lib/domain";
import {
  Store as StoreIcon,
  ShoppingCart,
  Warehouse,
  Layers,
  ShieldCheck,
  Bell,
  ArrowRight,
  UserPlus,
  PackagePlus,
  Rocket,
} from "lucide-react";

const FEATURES = [
  {
    icon: StoreIcon,
    title: "Onlayn vitrina",
    description: "Har bir do'kon o'z sahifasiga ega bo'ladi — mahsulotlaringiz internetda darhol ko'rina boshlaydi.",
  },
  {
    icon: ShoppingCart,
    title: "POS kassa tizimi",
    description: "Do'konda tezkor sotuv oynasi orqali savdo qiling, chek chiqaring, qoldiqlar avtomatik yangilanadi.",
  },
  {
    icon: Warehouse,
    title: "Ombor nazorati",
    description: "Mahsulot kelishi, qoldiqlar va kam qolgan tovarlar haqida vaqtida ogohlantirish oling.",
  },
  {
    icon: Layers,
    title: "Umumiy mahsulot katalogi",
    description: "Mahsulot ma'lumotlarini boshdan kiritmang — umumiy katalogdan tanlang, faqat narx va qoldiqni belgilang.",
  },
  {
    icon: ShieldCheck,
    title: "Telegram orqali xavfsizlik",
    description: "Ro'yxatdan o'tish va kirish Telegram bot orqali tasdiqlanadi — parolsiz kirish imkoni ham bor.",
  },
  {
    icon: Bell,
    title: "Real vaqtda bildirishnoma",
    description: "Yangi buyurtma yoki sotuv haqida do'kon jamoasi darhol, o'sha zahoti xabardor bo'ladi.",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "Ro'yxatdan o'ting",
    description: "Ism, telefon raqam va parol kiriting, Telegram bot orqali bir necha soniyada tasdiqlang.",
  },
  {
    icon: PackagePlus,
    title: "Do'kon turi va mahsulot qo'shing",
    description: "O'z sohangizga mos kategoriyalardan tanlang yoki shtrix-kod orqali mahsulotni avtomatik toping.",
  },
  {
    icon: Rocket,
    title: "Sotishni boshlang",
    description: "Do'konda POS orqali, internetda esa onlayn vitrina orqali — bir vaqtning o'zida ikkala tomondan soting.",
  },
];

export default async function HomePage() {
  const host = (await headers()).get("host") ?? "";
  const appUrl = appOrigin(host);

  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, description: true, logoUrl: true },
    take: 12,
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--brand-muted),transparent)]"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-2/3 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-brand" />
            Do&apos;konlar uchun yagona platforma
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Do&apos;koningizni <span className="text-brand">onlayn</span> va{" "}
            <span className="text-brand">offlaynda</span> birga boshqaring
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground text-balance sm:text-base">
            Onlayn vitrina, do&apos;konda POS tizimi, ombor nazorati va umumiy mahsulot katalogi — barchasi bitta
            platformada. Ro&apos;yxatdan o&apos;tish bepul va bir necha daqiqa vaqt oladi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-11 gap-2 bg-brand px-6 text-brand-foreground hover:bg-brand/90" render={<Link href={`${appUrl}/register`} />} nativeButton={false}>
              Do&apos;kon ochish
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" render={<Link href={`${appUrl}/register-customer`} />} nativeButton={false}>
              Xaridor sifatida ro&apos;yxatdan o&apos;ting
            </Button>
          </div>
          {stores.length > 0 && (
            <Link href="#dokonlar" className="mt-6 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              yoki faol do&apos;konlarni ko&apos;rib chiqing ↓
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-muted/20 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Nega aynan <span data-no-transliterate>e-mall.uz</span>?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Do&apos;kon ochish uchun kerak bo&apos;lgan hamma narsa — alohida dasturlar sotib olmasdan.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border bg-background p-5 shadow-xs transition-shadow hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Uch qadamda ishga tushiring</h2>
          </div>
          <div className="relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <step.icon className="size-6" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-[11px] font-bold text-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 max-w-[16rem] text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active stores */}
      <main id="dokonlar" className="flex-1 scroll-mt-14 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Faol do&apos;konlar</h2>
              <p className="mt-1 text-sm text-muted-foreground">Platformamizda savdo qilayotgan do&apos;konlar</p>
            </div>
          </div>

          {stores.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-4 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <StoreIcon className="size-6" />
              </div>
              <div>
                <p className="font-medium">Hozircha faol do&apos;konlar yo&apos;q</p>
                <p className="mt-1 text-sm text-muted-foreground">Birinchi bo&apos;lib do&apos;kon oching va shu yerda ko&apos;ring.</p>
              </div>
              <Button render={<Link href={`${appUrl}/register`} />} nativeButton={false}>
                Do&apos;kon ochish
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`https://${store.slug}.${ROOT_DOMAIN}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand">
                    <StoreIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{store.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {store.description ?? "Do'kon tavsifi kiritilmagan"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Closing CTA */}
      <section className="border-t bg-brand px-4 py-14 text-brand-foreground sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Bugun do&apos;koningizni oching</h2>
          <p className="max-w-lg text-sm text-brand-foreground/80 sm:text-base">
            Ro&apos;yxatdan o&apos;tish bepul. Telegram orqali tasdiqlab, bir necha daqiqada savdoni boshlang.
          </p>
          <Button
            size="lg"
            className="h-11 gap-2 bg-background px-6 text-foreground hover:bg-background/90"
            render={<Link href={`${appUrl}/register`} />}
            nativeButton={false}
          >
            Do&apos;kon ochish
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-6 items-center justify-center rounded-md bg-brand text-brand-foreground">
              <StoreIcon className="size-3.5" />
            </span>
            e-mall.uz
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href={`${appUrl}/register`} className="hover:text-foreground">
              Do&apos;kon ochish
            </Link>
            <Link href={`${appUrl}/register-customer`} className="hover:text-foreground">
              Xaridor bo&apos;lish
            </Link>
            <Link href={`${appUrl}/login`} className="hover:text-foreground">
              Kirish
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} e-mall.uz</p>
        </div>
      </footer>
    </div>
  );
}
