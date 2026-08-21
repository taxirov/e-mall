"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2, Banknote, CreditCard } from "lucide-react";
import { createSale } from "@/actions/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom } from "@/lib/format";

type Product = { id: string; name: string; price: string; stock: number; categoryId: string | null; imageUrl: string | null };
type CartLine = { productId: string; name: string; price: number; qty: number; maxStock: number };

export function PosScreen({ storeActive, initialProducts }: { storeActive: boolean; initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [pending, startTransition] = useTransition();
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  useRealtime((event, payload) => {
    if (event === "stock:update") {
      const data = payload as { productId: string; stock: number };
      setProducts((prev) => prev.map((p) => (p.id === data.productId ? { ...p, stock: data.stock } : p)));
    }
  });

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error("Qoldiqdan ortiq qo'shib bo'lmaydi");
          return prev;
        }
        return prev.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      if (product.stock < 1) return prev;
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), qty: 1, maxStock: product.stock }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.min(l.maxStock, Math.max(0, l.qty + delta)) } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function checkout() {
    if (cart.length === 0) return;
    startTransition(async () => {
      const result = await createSale({
        items: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
        paymentMethod,
      });
      if (result.ok) {
        toast.success("Sotuv muvaffaqiyatli yakunlandi");
        setProducts((prev) =>
          prev.map((p) => {
            const line = cart.find((l) => l.productId === p.id);
            return line ? { ...p, stock: p.stock - line.qty } : p;
          })
        );
        setLastReceipt(result.data.receiptNumber);
        setCart([]);
        setCartOpen(false);
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">POS</h1>
          {lastReceipt && (
            <span className="text-xs text-muted-foreground">Oxirgi chek: {lastReceipt}</span>
          )}
        </div>
        <Input
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <button key={product.id} type="button" onClick={() => addToCart(product)} className="text-left">
              <Card className="h-full transition-colors hover:border-primary active:scale-[0.98]">
                <CardContent className="p-3">
                  {product.imageUrl && (
                    <div className="mb-2 aspect-square overflow-hidden rounded bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.imageUrl} alt="" className="size-full object-cover" />
                    </div>
                  )}
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  <p className="mt-1 text-sm font-semibold">{formatSom(product.price)} so&apos;m</p>
                  <p className="text-xs text-muted-foreground">Qoldiq: {product.stock}</p>
                </CardContent>
              </Card>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Mahsulot topilmadi</p>
          )}
        </div>
      </div>

      {/* Desktop cart panel */}
      <div className="hidden w-80 shrink-0 md:block">
        <CartPanel
          cart={cart}
          total={total}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          changeQty={changeQty}
          removeLine={removeLine}
          checkout={checkout}
          pending={pending}
        />
      </div>

      {/* Mobile floating cart button */}
      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg md:hidden"
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
              cart={cart}
              total={total}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              changeQty={changeQty}
              removeLine={removeLine}
              checkout={checkout}
              pending={pending}
            />
          </div>
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CartPanel({
  cart,
  total,
  paymentMethod,
  setPaymentMethod,
  changeQty,
  removeLine,
  checkout,
  pending,
}: {
  cart: CartLine[];
  total: number;
  paymentMethod: "CASH" | "CARD";
  setPaymentMethod: (m: "CASH" | "CARD") => void;
  changeQty: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  checkout: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {cart.length === 0 && <p className="text-sm text-muted-foreground">Savat bo&apos;sh</p>}
        {cart.map((line) => (
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("CASH")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-sm",
            paymentMethod === "CASH" ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground"
          )}
        >
          <Banknote className="size-4" /> Naqd
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("CARD")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-sm",
            paymentMethod === "CARD" ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground"
          )}
        >
          <CreditCard className="size-4" /> Karta
        </button>
      </div>

      <div className="flex items-center justify-between text-lg font-semibold">
        <span>Jami</span>
        <span>{formatSom(total)} so&apos;m</span>
      </div>

      <Button className="w-full" size="lg" disabled={cart.length === 0 || pending} onClick={checkout}>
        {pending ? "Yakunlanmoqda..." : "Sotuvni yakunlash"}
      </Button>
    </div>
  );
}
