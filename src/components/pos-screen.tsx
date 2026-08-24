"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2, Banknote, CreditCard, X, Tag, ScanLine, Sparkles, Percent } from "lucide-react";
import { createSale, type ReceiptData } from "@/actions/pos";
import { validateCoupon } from "@/actions/coupons";
import { computeDiscount } from "@/lib/discount";
import { getEffectivePrice, isDiscountActive } from "@/lib/effective-price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatDateTime } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  price: string;
  stock: number;
  categoryId: string | null;
  imageUrl: string | null;
  barcode: string | null;
  isNew: boolean;
  discountPrice: string | null;
  discountEndsAt: string | null;
};
type Category = { id: string; name: string };
type CartLine = { productId: string; name: string; price: number; qty: number; maxStock: number };
type AppliedCoupon = { code: string; type: "PERCENT" | "FIXED"; value: number };
type CartTab = { id: string; label: string; lines: CartLine[]; paymentMethod: "CASH" | "CARD"; coupon: AppliedCoupon | null };

export function PosScreen({
  storeActive,
  categories,
  initialProducts,
}: {
  storeActive: boolean;
  categories: Category[];
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const tabCounter = useRef(1);
  const [tabs, setTabs] = useState<CartTab[]>([
    { id: "tab-1", label: "Savat 1", lines: [], paymentMethod: "CASH", coupon: null },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [cartOpen, setCartOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [couponPending, startCouponTransition] = useTransition();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useRealtime((event, payload) => {
    if (event === "stock:update") {
      const data = payload as { productId: string; stock: number };
      setProducts((prev) => prev.map((p) => (p.id === data.productId ? { ...p, stock: data.stock } : p)));
    }
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !activeCategory || p.categoryId === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [products, search, activeCategory]
  );

  const subtotal = activeTab.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = activeTab.coupon ? computeDiscount(activeTab.coupon.type, activeTab.coupon.value, subtotal) : 0;
  const total = subtotal - discount;
  const itemCount = activeTab.lines.reduce((sum, line) => sum + line.qty, 0);

  function updateTab(id: string, updater: (tab: CartTab) => CartTab) {
    setTabs((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
  }

  function addToCart(product: Product) {
    updateTab(activeTab.id, (tab) => {
      const existing = tab.lines.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error("Qoldiqdan ortiq qo'shib bo'lmaydi");
          return tab;
        }
        return { ...tab, lines: tab.lines.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l)) };
      }
      if (product.stock < 1) return tab;
      const price = getEffectivePrice(
        Number(product.price),
        product.discountPrice ? Number(product.discountPrice) : null,
        product.discountEndsAt
      );
      return {
        ...tab,
        lines: [...tab.lines, { productId: product.id, name: product.name, price, qty: 1, maxStock: product.stock }],
      };
    });
  }

  function handleBarcodeScanned(code: string) {
    const product = products.find((p) => p.barcode === code);
    if (!product) {
      toast.error("Bu shtrix-kodli mahsulot topilmadi");
      return;
    }
    addToCart(product);
    toast.success(product.name);
  }

  function changeQty(productId: string, delta: number) {
    updateTab(activeTab.id, (tab) => ({
      ...tab,
      lines: tab.lines
        .map((l) => (l.productId === productId ? { ...l, qty: Math.min(l.maxStock, Math.max(0, l.qty + delta)) } : l))
        .filter((l) => l.qty > 0),
    }));
  }

  function removeLine(productId: string) {
    updateTab(activeTab.id, (tab) => ({ ...tab, lines: tab.lines.filter((l) => l.productId !== productId) }));
  }

  function setPaymentMethod(method: "CASH" | "CARD") {
    updateTab(activeTab.id, (tab) => ({ ...tab, paymentMethod: method }));
  }

  function clearActiveTab() {
    updateTab(activeTab.id, (tab) => ({ ...tab, lines: [], coupon: null }));
  }

  function newTab() {
    tabCounter.current += 1;
    const tab: CartTab = {
      id: `tab-${Date.now()}`,
      label: `Savat ${tabCounter.current}`,
      lines: [],
      paymentMethod: "CASH",
      coupon: null,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }

  function closeTab(id: string) {
    setTabs((prev) => {
      if (prev.length === 1) return prev.map((t) => (t.id === id ? { ...t, lines: [], coupon: null } : t));
      return prev.filter((t) => t.id !== id);
    });
  }

  function applyCoupon(code: string) {
    if (!code.trim()) return;
    startCouponTransition(async () => {
      const result = await validateCoupon(code, subtotal);
      if (result.ok) {
        updateTab(activeTab.id, (tab) => ({ ...tab, coupon: { code: result.code, type: result.type, value: result.value } }));
        toast.success(`Kupon qo'llandi: ${result.code}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeCoupon() {
    updateTab(activeTab.id, (tab) => ({ ...tab, coupon: null }));
  }

  function checkout() {
    if (activeTab.lines.length === 0) return;
    const tabId = activeTab.id;
    const saleLines = activeTab.lines;
    const saleMethod = activeTab.paymentMethod;
    const saleCouponCode = activeTab.coupon?.code ?? null;

    startTransition(async () => {
      const result = await createSale({
        items: saleLines.map((l) => ({ productId: l.productId, qty: l.qty })),
        paymentMethod: saleMethod,
        couponCode: saleCouponCode,
      });
      if (result.ok) {
        toast.success("Sotuv muvaffaqiyatli yakunlandi");
        setProducts((prev) =>
          prev.map((p) => {
            const line = saleLines.find((l) => l.productId === p.id);
            return line ? { ...p, stock: p.stock - line.qty } : p;
          })
        );
        setReceipt(result.data.receipt);
        setReceiptOpen(true);
        setCartOpen(false);
        setTabs((prev) => {
          if (prev.length === 1) return prev.map((t) => (t.id === tabId ? { ...t, lines: [], coupon: null } : t));
          return prev.filter((t) => t.id !== tabId);
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!storeActive) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Do&apos;kon hali faollashtirilmagan. POS tizimidan foydalanish uchun do&apos;kon Super Admin tomonidan tasdiqlanishi kerak.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative pb-20 md:pb-0 md:flex md:gap-6">
      <div className="md:flex-1">
        <h1 className="mb-4 text-xl font-semibold">POS</h1>

        {categories.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                !activeCategory ? "border-brand bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Barchasi
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat.id ? "border-brand bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Shtrix-kod skanerlash">
            <ScanLine className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const discountActive = isDiscountActive(
              product.discountPrice ? Number(product.discountPrice) : null,
              product.discountEndsAt
            );
            return (
              <button key={product.id} type="button" onClick={() => addToCart(product)} className="text-left">
                <Card className="h-full overflow-hidden transition-all hover:border-brand hover:shadow-md active:scale-[0.98]">
                  <div className="relative">
                    {product.imageUrl ? (
                      <div className="aspect-square overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl} alt="" className="size-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-muted">
                        <ShoppingCart className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    {product.isNew && (
                      <Badge className="absolute top-1.5 left-1.5 gap-1 bg-brand text-brand-foreground">
                        <Sparkles className="size-3" /> Yangilik
                      </Badge>
                    )}
                    {discountActive && (
                      <Badge variant="destructive" className="absolute top-1.5 right-1.5 gap-1">
                        <Percent className="size-3" /> Chegirma
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                    {discountActive ? (
                      <>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground line-through">{formatSom(product.price)}</span>
                          <span className="text-sm font-semibold text-destructive">{formatSom(product.discountPrice!)} so&apos;m</span>
                        </div>
                        <p className="text-[11px] text-destructive">{formatDateTime(product.discountEndsAt!)} gacha</p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-brand">{formatSom(product.price)} so&apos;m</p>
                    )}
                    <p className="text-xs text-muted-foreground">Qoldiq: {product.stock}</p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Mahsulot topilmadi</p>
          )}
        </div>
      </div>

      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={handleBarcodeScanned} />

      {/* Desktop billing panel */}
      <div className="hidden w-80 shrink-0 md:block">
        <Card className="p-4">
          <CartPanel
            tabs={tabs}
            activeTab={activeTab}
            setActiveTabId={setActiveTabId}
            newTab={newTab}
            closeTab={closeTab}
            subtotal={subtotal}
            discount={discount}
            total={total}
            changeQty={changeQty}
            removeLine={removeLine}
            setPaymentMethod={setPaymentMethod}
            checkout={checkout}
            clearActiveTab={clearActiveTab}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
            couponPending={couponPending}
            pending={pending}
          />
        </Card>
      </div>

      {/* Mobile floating cart button */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-brand px-4 py-3 text-brand-foreground shadow-lg md:hidden"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart className="size-5" />
            {itemCount} mahsulot
          </span>
          <span className="font-semibold">{formatSom(total)} so&apos;m</span>
        </button>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Savat</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <CartPanel
              tabs={tabs}
              activeTab={activeTab}
              setActiveTabId={setActiveTabId}
              newTab={newTab}
              closeTab={closeTab}
              subtotal={subtotal}
              discount={discount}
              total={total}
              changeQty={changeQty}
              removeLine={removeLine}
              setPaymentMethod={setPaymentMethod}
              checkout={checkout}
              clearActiveTab={clearActiveTab}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              couponPending={couponPending}
              pending={pending}
            />
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>

      <ReceiptDialog receipt={receipt} open={receiptOpen} onOpenChange={setReceiptOpen} />
    </div>
  );
}

function CartPanel({
  tabs,
  activeTab,
  setActiveTabId,
  newTab,
  closeTab,
  subtotal,
  discount,
  total,
  changeQty,
  removeLine,
  setPaymentMethod,
  checkout,
  clearActiveTab,
  applyCoupon,
  removeCoupon,
  couponPending,
  pending,
}: {
  tabs: CartTab[];
  activeTab: CartTab;
  setActiveTabId: (id: string) => void;
  newTab: () => void;
  closeTab: (id: string) => void;
  subtotal: number;
  discount: number;
  total: number;
  changeQty: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  setPaymentMethod: (m: "CASH" | "CARD") => void;
  checkout: () => void;
  clearActiveTab: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  couponPending: boolean;
  pending: boolean;
}) {
  const [couponInput, setCouponInput] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          const count = tab.lines.reduce((sum, l) => sum + l.qty, 0);
          return (
            <div
              key={tab.id}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                isActive ? "border-brand bg-brand/10 text-brand" : "text-muted-foreground"
              )}
            >
              <button type="button" onClick={() => setActiveTabId(tab.id)} className="flex items-center gap-1">
                {tab.label}
                {count > 0 && <span className="rounded-full bg-current/10 px-1.5">{count}</span>}
              </button>
              {tabs.length > 1 && (
                <button type="button" onClick={() => closeTab(tab.id)} aria-label={`${tab.label} savatini yopish`}>
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={newTab}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand"
        >
          <Plus className="size-3" /> Yangi savat
        </button>
      </div>

      <div className="space-y-2">
        {activeTab.lines.length === 0 && <p className="text-sm text-muted-foreground">Savat bo&apos;sh</p>}
        {activeTab.lines.map((line) => (
          <div key={line.productId} className="flex items-center justify-between gap-2 border-b pb-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.name}</p>
              <p className="text-xs text-muted-foreground">{formatSom(line.price)} so&apos;m</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-7" onClick={() => changeQty(line.productId, -1)}>
                <Minus className="size-3" />
              </Button>
              <span className="w-6 text-center text-sm">{line.qty}</span>
              <Button size="icon" variant="outline" className="size-7" onClick={() => changeQty(line.productId, 1)}>
                <Plus className="size-3" />
              </Button>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => removeLine(line.productId)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {activeTab.lines.length > 0 &&
        (activeTab.coupon ? (
          <div className="flex items-center justify-between rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-brand">
              <Tag className="size-3.5" />
              {activeTab.coupon.code}
            </span>
            <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Kupon kodi"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCoupon(couponInput);
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!couponInput.trim() || couponPending}
              onClick={() => applyCoupon(couponInput)}
            >
              Qo&apos;llash
            </Button>
          </div>
        ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("CASH")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-sm",
            activeTab.paymentMethod === "CASH" ? "border-brand bg-brand/10 font-medium text-brand" : "text-muted-foreground"
          )}
        >
          <Banknote className="size-4" /> Naqd
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("CARD")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-sm",
            activeTab.paymentMethod === "CARD" ? "border-brand bg-brand/10 font-medium text-brand" : "text-muted-foreground"
          )}
        >
          <CreditCard className="size-4" /> Karta
        </button>
      </div>

      {discount > 0 && (
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Oraliq summa</span>
            <span>{formatSom(subtotal)} so&apos;m</span>
          </div>
          <div className="flex items-center justify-between text-brand">
            <span>Chegirma</span>
            <span>-{formatSom(discount)} so&apos;m</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>Jami</span>
        <span>{formatSom(total)} so&apos;m</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
          disabled={activeTab.lines.length === 0 || pending}
          onClick={clearActiveTab}
        >
          Bekor qilish
        </Button>
        <Button
          className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={activeTab.lines.length === 0 || pending}
          onClick={checkout}
        >
          {pending ? "Yakunlanmoqda..." : "Sotuvni yakunlash"}
        </Button>
      </div>
    </div>
  );
}
