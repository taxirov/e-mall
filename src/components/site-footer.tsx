import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 pb-20 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" data-no-transliterate className="flex items-center gap-2 font-semibold">
              <Image src="/logo-96.png" alt="" width={28} height={28} className="rounded-md" />
              e-mall.uz
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Do&apos;konlar va kafelar uchun zamonaviy onlayn savdo maydonchasi — hammasi bir joyda.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Xaridorlar uchun</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Do&apos;konlar va kafelar</Link></li>
              <li><Link href="/favorites" className="hover:text-foreground">Sevimlilar</Link></li>
              <li><Link href="/cart" className="hover:text-foreground">Savat</Link></li>
              <li><Link href="/orders" className="hover:text-foreground">Buyurtmalarim</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Biznes uchun</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground">Do&apos;kon ochish</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Kirish</Link></li>
              <li><Link href="/offer/store" className="hover:text-foreground">Do&apos;kon egasi uchun oferta</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Huquqiy</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Foydalanish shartlari</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Maxfiylik siyosati</Link></li>
              <li><Link href="/offer/customer" className="hover:text-foreground">Xaridor uchun oferta</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground sm:text-left">
          © {year} e-mall.uz. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
