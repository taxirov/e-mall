"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, MapPin, BadgeCheck, UtensilsCrossed, ArrowLeft, Clock, Star, Bike, Info } from "lucide-react";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { InfoBadges, type InfoBadge } from "@/components/info-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import { LocationPicker } from "@/components/location-picker";
import { cafeOrigin, type EcafeCafeMenu, type EcafeMenuItem, type EcafeMenuItemVariant } from "@/lib/ecafe";
import { submitCafeOrder } from "@/actions/cafe-order";
import { formatSom } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cart is keyed by menuItemId, or `${menuItemId}::${variantId}` when the item has variants. */
function cartKey(itemId: string, variantId?: string | null) {
  return variantId ? `${itemId}::${variantId}` : itemId;
}

export function CafeOrdering({ slug, cafe }: { slug: string; cafe: EcafeCafeMenu }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPickerItem, setVariantPickerItem] = useState<EcafeMenuItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [orderResult, setOrderResult] = useState<{ orderId: string } | null>(null);

  const allItems = useMemo(() => cafe.categories.flatMap((c) => c.items), [cafe.categories]);
  const itemsById = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);

  const cartLines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const [itemId, variantId] = key.split("::");
      const item = itemsById.get(itemId);
      const variant = variantId ? item?.variants.find((v) => v.id === variantId) : undefined;
      return { key, item, variant, qty };
    })
    .filter((l): l is typeof l & { item: EcafeMenuItem } => Boolean(l.item));

  const linePrice = (item: EcafeMenuItem, variant?: EcafeMenuItemVariant) => variant?.price ?? item.price;

  const subtotal = cartLines.reduce((sum, l) => sum + linePrice(l.item, l.variant) * l.qty, 0);
  const total = subtotal + cafe.deliveryFee;
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

  function addToCart(key: string, delta: number) {
    setCart((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
  }

  function submit(formData: FormData) {
    setError(null);
    if (!coords) {
      setError("Xaritada yetkazib berish manzilini belgilang");
      return;
    }
    if (cafe.minOrderTotal > 0 && subtotal < cafe.minOrderTotal) {
      setError(`Minimal buyurtma summasi ${formatSom(cafe.minOrderTotal)} so'm`);
      return;
    }
    startTransition(async () => {
      const result = await submitCafeOrder(slug, {
        items: cartLines.map((l) => ({ menuItemId: l.item.id, variantId: l.variant?.id ?? null, qty: l.qty })),
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        latitude: coords.lat,
        longitude: coords.lng,
        note: formData.get("note") ? String(formData.get("note")) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrderResult({ orderId: result.orderId });
    });
  }

  const infoBadges: InfoBadge[] = [
    ...(cafe.estimatedDeliveryTime
      ? [{ icon: Clock, colorClassName: "bg-violet-100 text-violet-600", value: cafe.estimatedDeliveryTime, label: "yetkazish" }]
      : []),
    { icon: Star, colorClassName: "bg-emerald-100 text-emerald-600", value: "– –", label: "reyting" },
    {
      icon: Bike,
      colorClassName: "bg-amber-100 text-amber-600",
      value: cafe.deliveryFee > 0 ? `${formatSom(cafe.deliveryFee)} so'm` : "Bepul",
      label: "yetkazish",
    },
    ...(cafe.workingHours ? [{ icon: Info, colorClassName: "bg-sky-100 text-sky-600", value: cafe.workingHours, label: "ish tartibi" }] : []),
  ];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col pb-24">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-2 sm:px-4">
          <Link
            href="/"
            aria-label="Orqaga"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="flex items-center justify-center gap-1 truncate font-bold">
              <span className="truncate">{cafe.name}</span>
              {/* fetchCafeMenu only ever returns a non-active cafe's menu as null — see lib/ecafe.ts. */}
              <BadgeCheck className="size-4 shrink-0 text-brand" aria-label="Tasdiqlangan kafe" />
            </p>
          </div>
          <div className="size-10 shrink-0" />
        </div>
        <div className="border-t"><InfoBadges items={infoBadges} /></div>
        {cafe.address && (
          <div className="border-t px-4 py-2">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-brand" /> {cafe.address}
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-6 px-4 py-5">
        {cafe.categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {category.items.map((item) => {
                const hasVariants = item.variants.length > 0;
                const key = cartKey(item.id);
                const qty = hasVariants ? 0 : (cart[key] ?? 0);
                const itemCartQty = hasVariants
                  ? item.variants.reduce((sum, v) => sum + (cart[cartKey(item.id, v.id)] ?? 0), 0)
                  : qty;

                return (
                  <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <UtensilsCrossed className="size-6 text-muted-foreground" />
                        </div>
                      )}

                      {hasVariants ? (
                        <button
                          type="button"
                          onClick={() => setVariantPickerItem(item)}
                          className={cn(
                            "absolute right-2 bottom-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-colors",
                            itemCartQty > 0 ? "bg-brand text-brand-foreground" : "bg-background text-foreground"
                          )}
                        >
                          {itemCartQty > 0 ? `Tanlangan (${itemCartQty})` : "Tanlash"}
                        </button>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(key, 1)}
                          aria-label="Savatga qo'shish"
                          className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md transition-transform active:scale-90"
                        >
                          <Plus className="size-4" />
                        </button>
                      ) : (
                        <div className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-full bg-background px-1.5 py-1 shadow-md">
                          <button
                            type="button"
                            onClick={() => addToCart(key, -1)}
                            aria-label="Kamaytirish"
                            className="flex size-6 items-center justify-center rounded-full hover:bg-muted"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm font-medium">{qty}</span>
                          <button
                            type="button"
                            onClick={() => addToCart(key, 1)}
                            aria-label="Ko'paytirish"
                            className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-brand">
                        {hasVariants
                          ? `${formatSom(Math.min(...item.variants.map((v) => v.price)))} so'mdan`
                          : `${formatSom(item.price)} so'm`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        {cafe.categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Hozircha menyu bo&apos;sh.</p>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-2xl border-t bg-background p-3 sm:bottom-0">
          <Button className="w-full" size="lg" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="size-4" />
            Savat ({cartCount}) — {formatSom(subtotal)} so&apos;m
          </Button>
        </div>
      )}

      <Dialog open={!!variantPickerItem} onOpenChange={(open) => !open && setVariantPickerItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{variantPickerItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-1">
            {variantPickerItem?.variants.map((v) => {
              const key = cartKey(variantPickerItem.id, v.id);
              const vQty = cart[key] ?? 0;
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-brand">{formatSom(v.price)} so&apos;m</p>
                  </div>
                  {vQty === 0 ? (
                    <Button size="sm" variant="outline" onClick={() => addToCart(key, 1)}>
                      Qo&apos;shish
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, -1)}>
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center text-sm font-medium">{vQty}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, 1)}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:mx-auto">
          <SheetHeader>
            <SheetTitle>Buyurtmani tasdiqlash</SheetTitle>
          </SheetHeader>
          {orderResult ? (
            <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
              <p className="font-medium">Buyurtmangiz qabul qilindi!</p>
              <p className="text-sm text-muted-foreground">Holatini kuzatish uchun quyidagi havolaga o&apos;ting.</p>
              <Button
                render={<a href={`${cafeOrigin(slug)}/order/${orderResult.orderId}`} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                Buyurtmani kuzatish
              </Button>
            </div>
          ) : (
            <form action={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              <div className="space-y-2">
                {cartLines.map((l) => (
                  <div key={l.key} className="flex items-center justify-between text-sm">
                    <span>
                      {l.item.name}
                      {l.variant ? ` (${l.variant.name})` : ""} × {l.qty}
                    </span>
                    <span className="font-medium">{formatSom(linePrice(l.item, l.variant) * l.qty)} so&apos;m</span>
                  </div>
                ))}
                {cafe.deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Yetkazib berish</span>
                    <span>{formatSom(cafe.deliveryFee)} so&apos;m</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                  <span>Jami</span>
                  <span>{formatSom(total)} so&apos;m</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Ismingiz</Label>
                <Input id="customerName" name="customerName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqam</Label>
                <PhoneInput />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Textarea id="address" name="address" required rows={2} />
                <LocationPicker value={coords} onChange={setCoords} height={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
                <Textarea id="note" name="note" rows={2} placeholder="Masalan: achchiq bo'lmasin" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <SheetFooter className="p-0">
                <Button type="submit" size="lg" disabled={pending || cartLines.length === 0}>
                  {pending ? "Yuborilmoqda..." : `Buyurtma berish — ${formatSom(total)} so'm`}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <MobileTabBar />
    </div>
  );
}
