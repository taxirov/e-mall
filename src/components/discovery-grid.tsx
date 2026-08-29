"use client";

import { useEffect, useMemo, useState } from "react";
import { Store as StoreIcon, UtensilsCrossed } from "lucide-react";
import { haversineDistanceKm } from "@/lib/geo";
import { cn } from "@/lib/utils";

export type DiscoveryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  href: string;
};

/**
 * Uzum-Tezkor-style discovery grid: two tabs (e-mall's own stores, and
 * e-cafe.uz's cafes/restaurants fetched cross-app), sorted by distance from
 * the visitor's browser geolocation when granted. Denying/lacking
 * geolocation just falls back to the server-provided order (newest first) —
 * never blocks or errors the page.
 */
export function DiscoveryGrid({ stores, cafes }: { stores: DiscoveryItem[]; cafes: DiscoveryItem[] }) {
  const [tab, setTab] = useState<"stores" | "cafes">("stores");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const items = tab === "stores" ? stores : cafes;

  const sorted = useMemo(() => {
    const withDistance = items.map((item) => ({
      ...item,
      distanceKm:
        userLocation && item.latitude != null && item.longitude != null
          ? haversineDistanceKm(userLocation, { lat: item.latitude, lng: item.longitude })
          : null,
    }));
    if (!userLocation) return withDistance;
    return withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [items, userLocation]);

  return (
    <div>
      <div className="mb-6 inline-flex items-center rounded-full border p-1">
        <button
          type="button"
          onClick={() => setTab("stores")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            tab === "stores" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <StoreIcon className="size-4" />
          Do&apos;konlar ({stores.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("cafes")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            tab === "cafes" ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UtensilsCrossed className="size-4" />
          Kafe va restoranlar ({cafes.length})
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-16 text-center text-muted-foreground">
          <p className="font-medium text-foreground">
            {tab === "stores" ? "Hozircha faol do'konlar yo'q" : "Hozircha faol kafe/restoranlar yo'q"}
          </p>
          <p className="text-sm">Tez orada shu yerda ko&apos;rinadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand">
                {item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logoUrl} alt="" className="size-full object-cover" />
                ) : tab === "stores" ? (
                  <StoreIcon className="size-5" />
                ) : (
                  <UtensilsCrossed className="size-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {item.description ?? (tab === "stores" ? "Do'kon tavsifi kiritilmagan" : "Tavsif kiritilmagan")}
                </p>
                {item.distanceKm != null && (
                  <p className="mt-1 text-xs font-medium text-brand">
                    ~{item.distanceKm < 1 ? "1" : Math.round(item.distanceKm)} km
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
