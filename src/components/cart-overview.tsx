"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Store as StoreIcon } from "lucide-react";
import { lookupStoresBySlug, type StoreLookup } from "@/actions/store";
import { formatSom } from "@/lib/format";
import type { CartLine } from "@/hooks/use-cart";

const CART_KEY_PREFIX = "emall-cart:";

type StoreCart = { slug: string; lines: CartLine[]; total: number; itemCount: number };

/**
 * Carts stay per-store (see use-cart.ts) — this just surveys every
 * emall-cart:* key in localStorage and shows which stores have something
 * waiting, linking into each one's own checkout. Only sees carts created via
 * /mall/{slug} (same origin as this page) — a cart built on a store's own
 * {slug}.e-mall.uz subdomain lives in that subdomain's separate localStorage
 * and won't show up here.
 */
export function CartOverview() {
  const [carts, setCarts] = useState<StoreCart[] | null>(null);
  const [stores, setStores] = useState<Record<string, StoreLookup>>({});

  useEffect(() => {
    const found: StoreCart[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CART_KEY_PREFIX)) continue;
      try {
        const lines = JSON.parse(localStorage.getItem(key) ?? "[]") as CartLine[];
        if (lines.length > 0) {
          const slug = key.slice(CART_KEY_PREFIX.length);
          found.push({
            slug,
            lines,
            total: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
            itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
          });
        }
      } catch {
        // ignore corrupt cart data
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarts(found);
    if (found.length > 0) {
      lookupStoresBySlug(found.map((c) => c.slug)).then((results) => {
        setStores(Object.fromEntries(results.map((s) => [s.slug, s])));
      });
    }
  }, []);

  if (carts === null) return null;

  if (carts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-6" />
        </div>
        <div>
          <p className="font-semibold">Savatingiz bo&apos;sh</p>
          <p className="mt-1 text-sm text-muted-foreground">Do&apos;konlardan mahsulot tanlab, savatga qo&apos;shing.</p>
        </div>
        <Link href="/" className="text-sm font-medium text-brand underline underline-offset-4">
          Do&apos;konlarni ko&apos;rish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {carts.map((cart) => {
        const store = stores[cart.slug];
        return (
          <Link
            key={cart.slug}
            href={`/mall/${cart.slug}`}
            className="flex items-center gap-3 rounded-2xl border bg-background p-3 transition-colors hover:border-brand/40"
          >
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {store?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <StoreIcon className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{store?.name ?? cart.slug}</p>
              <p className="text-xs text-muted-foreground">{cart.itemCount} mahsulot</p>
            </div>
            <p className="font-semibold text-brand">{formatSom(cart.total)} so&apos;m</p>
          </Link>
        );
      })}
    </div>
  );
}
