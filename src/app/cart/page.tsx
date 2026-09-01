import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { CartOverview } from "@/components/cart-overview";

export default function CartPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pt-4 pb-24 sm:pb-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-xl font-semibold">Savat</h1>
          <CartOverview />
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
