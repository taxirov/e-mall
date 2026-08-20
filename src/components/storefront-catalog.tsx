"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Trash2, PackageSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { formatSom } from "@/lib/format";

type Product = { id: string; name: string; price: string; stock: number; categoryId: string | null; images: string[] };
type Category = { id: string; name: string };

export function StorefrontCatalog({
  storeSlug,
  initialProducts,
  categories,
}: {
  storeSlug: string;
  initialProducts: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, addToCart, changeQty, removeLine, total, itemCount } = useCart(storeSlug);

  const filtered = useMemo(
    () =>
      initialProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) &&
          (!activeCategory || p.categoryId === activeCategory)
      ),
    [initialProducts, search, activeCategory]
  );

  return (
    <div className="pb-24">
      <Input placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory(null)}>
            <Badge variant={activeCategory === null ? "default" : "secondary"}>Barchasi</Badge>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}>
              <Badge variant={activeCategory === c.id ? "default" : "secondary"}>{c.name}</Badge>
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
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-3">
                <div className="mb-2 aspect-square rounded-md bg-muted" />
                <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                <p className="mt-1 text-sm font-semibold">{formatSom(product.price)} so&apos;m</p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    addToCart({ id: product.id, name: product.name, price: Number(product.price), stock: product.stock })
                  }
                >
                  Savatga qo&apos;shish
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg"
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
              className={cn("w-full", cart.length === 0 && "pointer-events-none opacity-50")}
            >
              Buyurtmani rasmiylashtirish
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
