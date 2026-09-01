"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, PackageSearch, Store as StoreIcon } from "lucide-react";
import { toggleFavorite } from "@/actions/favorites";
import { formatSom, formatDateTime } from "@/lib/format";
import { isDiscountActive } from "@/lib/effective-price";

export type FavoriteProduct = {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: string;
  discountPrice: string | null;
  discountEndsAt: string | null;
  storeName: string;
  storeSlug: string;
};

export function FavoritesList({ initialItems }: { initialItems: FavoriteProduct[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    startTransition(async () => {
      const result = await toggleFavorite(productId);
      if (!result.ok) toast.error(result.error);
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Heart className="size-6" />
        </div>
        <div>
          <p className="font-semibold">Sevimlilar ro&apos;yxati bo&apos;sh</p>
          <p className="mt-1 text-sm text-muted-foreground">Yoqqan mahsulotlarni yurak belgisi orqali shu yerga qo&apos;shing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => {
        const discountActive = isDiscountActive(
          item.discountPrice ? Number(item.discountPrice) : null,
          item.discountEndsAt
        );
        return (
          <div key={item.productId} className="overflow-hidden rounded-2xl border bg-background">
            <Link href={`/mall/${item.storeSlug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <PackageSearch className="size-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              <p data-no-transliterate className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <StoreIcon className="size-3" /> {item.storeName}
              </p>
              {discountActive ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground line-through">{formatSom(item.price)}</span>
                  <span className="text-sm font-semibold text-destructive">{formatSom(item.discountPrice!)} so&apos;m</span>
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-brand">{formatSom(item.price)} so&apos;m</p>
              )}
              {discountActive && (
                <p className="text-[11px] text-destructive">{formatDateTime(item.discountEndsAt!)} gacha</p>
              )}
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                <Heart className="size-3.5 fill-current" /> Olib tashlash
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
