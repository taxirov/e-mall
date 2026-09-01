"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2, PackageSearch, Search, Sparkles, Percent, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useLatinizedSearch } from "@/hooks/use-latinized-search";
import { formatSom, formatDateTime } from "@/lib/format";
import { getEffectivePrice, isDiscountActive } from "@/lib/effective-price";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";
import { toggleFavorite } from "@/actions/favorites";

type Product = {
  id: string;
  name: string;
  price: string;
  stock: number;
  categoryId: string | null;
  imageUrl: string | null;
  isNew: boolean;
  discountPrice: string | null;
  discountEndsAt: string | null;
};
type Category = { id: string; name: string };

export function StorefrontCatalog({
  storeSlug,
  initialProducts,
  categories,
  initialFavoriteIds = [],
}: {
  storeSlug: string;
  initialProducts: Product[];
  categories: Category[];
  initialFavoriteIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, addToCart, changeQty, removeLine, total, itemCount } = useCart(storeSlug);
  const [favoriteIds, setFavoriteIds] = useState(new Set(initialFavoriteIds));
  const [, startFavoriteTransition] = useTransition();

  function handleToggleFavorite(productId: string) {
    const wasFavorited = favoriteIds.has(productId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(productId);
      else next.add(productId);
      return next;
    });
    startFavoriteTransition(async () => {
      const result = await toggleFavorite(productId);
      if (!result.ok) {
        toast.error(result.error);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
    });
  }

  const searchTerm = useLatinizedSearch(search);
  const filtered = useMemo(
    () =>
      initialProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (!activeCategory || p.categoryId === activeCategory)
      ),
    [initialProducts, searchTerm, activeCategory]
  );

  return (
    <div className="pb-24">
      {!ONLINE_ORDERING_ENABLED && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Hozircha faqat mahsulotlarni ko&apos;rish mumkin — onlayn buyurtma tez orada ishga tushadi.
        </div>
      )}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === c.id ? "border-brand bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <PackageSearch className="size-8" />
          <p className="text-sm">Mahsulot topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((product) => {
            const discountActive = isDiscountActive(
              product.discountPrice ? Number(product.discountPrice) : null,
              product.discountEndsAt
            );
            const effectivePrice = getEffectivePrice(
              Number(product.price),
              product.discountPrice ? Number(product.discountPrice) : null,
              product.discountEndsAt
            );
            return (
              <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <PackageSearch className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  {product.isNew && (
                    <Badge className="absolute top-1.5 left-1.5 gap-1 bg-brand text-brand-foreground">
                      <Sparkles className="size-3" /> Yangilik
                    </Badge>
                  )}
                  <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(product.id)}
                      aria-label="Sevimlilarga qo'shish"
                      className="flex size-7 items-center justify-center rounded-full bg-background/90 shadow-xs backdrop-blur"
                    >
                      <Heart
                        className={cn(
                          "size-3.5",
                          favoriteIds.has(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"
                        )}
                      />
                    </button>
                    {discountActive && (
                      <Badge variant="destructive" className="gap-1">
                        <Percent className="size-3" /> Chegirma
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  {discountActive ? (
                    <>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground line-through">{formatSom(product.price)}</span>
                        <span className="text-sm font-semibold text-destructive">{formatSom(effectivePrice)} so&apos;m</span>
                      </div>
                      <p className="text-[11px] text-destructive">{formatDateTime(product.discountEndsAt!)} gacha</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-brand">{formatSom(product.price)} so&apos;m</p>
                  )}
                  <p className="text-xs text-muted-foreground">Qoldiq: {product.stock}</p>
                  {ONLINE_ORDERING_ENABLED && (
                    <Button
                      size="sm"
                      className="mt-2 w-full bg-brand text-brand-foreground hover:bg-brand/90"
                      onClick={() => addToCart({ id: product.id, name: product.name, price: effectivePrice, stock: product.stock })}
                    >
                      Savatga qo&apos;shish
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {ONLINE_ORDERING_ENABLED && (
        <>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-brand px-4 py-3 text-brand-foreground shadow-lg"
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
              <div className="space-y-3 px-4">
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
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Jami</span>
                  <span>{formatSom(total)} so&apos;m</span>
                </div>
              </div>
              <SheetFooter>
                <Button
                  render={<Link href="/checkout" />}
                  nativeButton={false}
                  size="lg"
                  className={cn(
                    "w-full bg-brand text-brand-foreground hover:bg-brand/90",
                    cart.length === 0 && "pointer-events-none opacity-50"
                  )}
                >
                  Buyurtmani rasmiylashtirish
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
