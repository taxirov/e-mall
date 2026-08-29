"use client";

import { useEffect, useMemo, useState } from "react";
import { Store as StoreIcon, UtensilsCrossed, Search, MapPin, LocateFixed } from "lucide-react";
import { haversineDistanceKm, isWithinRadius, isPointInPolygon, type LatLng } from "@/lib/geo";
import { useLatinizedSearch } from "@/hooks/use-latinized-search";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DiscoveryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
  servicePolygon: LatLng[] | null;
  href: string;
};

function isServed(point: LatLng, item: DiscoveryItem): boolean {
  if (item.servicePolygon && item.servicePolygon.length >= 3) return isPointInPolygon(point, item.servicePolygon);
  if (item.serviceRadiusKm != null && item.latitude != null && item.longitude != null) {
    return isWithinRadius(point, { lat: item.latitude, lng: item.longitude }, item.serviceRadiusKm);
  }
  // No service area configured yet — don't punish the owner for not having
  // set one up, just show it unfiltered (still sorted by distance below).
  return true;
}

/**
 * Uzum-Tezkor-style discovery grid: a location indicator, search, two tabs
 * (e-mall's own stores, and e-cafe.uz's cafes/restaurants fetched
 * cross-app). Once the visitor's browser geolocation is granted, the list
 * is filtered down to only stores/cafes whose service area (radius or
 * polygon) actually covers that point, then sorted by distance. Denying/
 * lacking geolocation just falls back to the full, unfiltered
 * server-provided order — never blocks or errors the page.
 */
export function DiscoveryGrid({ stores, cafes }: { stores: DiscoveryItem[]; cafes: DiscoveryItem[] }) {
  const [tab, setTab] = useState<"stores" | "cafes">("stores");
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "granted" | "denied">("idle");
  const searchTerm = useLatinizedSearch(search);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocation();
  }, []);

  const items = tab === "stores" ? stores : cafes;

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
    const withDistance = filtered.map((item) => ({
      ...item,
      distanceKm:
        userLocation && item.latitude != null && item.longitude != null
          ? haversineDistanceKm(userLocation, { lat: item.latitude, lng: item.longitude })
          : null,
    }));
    if (!userLocation) return withDistance;
    return withDistance
      .filter((item) => isServed(userLocation, item))
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [items, userLocation, searchTerm]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={requestLocation}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {locationStatus === "granted" ? <MapPin className="size-3.5 text-brand" /> : <LocateFixed className="size-3.5" />}
        {locationStatus === "granted" && "Joylashuvingiz asosida ko'rsatilmoqda"}
        {locationStatus === "locating" && "Joylashuv aniqlanmoqda..."}
        {locationStatus === "denied" && "Joylashuvni yoqish uchun bosing"}
        {locationStatus === "idle" && "Joylashuvni aniqlash"}
      </button>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Qidiruv"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-full pl-10"
        />
      </div>

      <div className="inline-flex items-center rounded-full border p-1">
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

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-16 text-center text-muted-foreground">
          <p className="font-medium text-foreground">
            {search
              ? "Hech narsa topilmadi"
              : userLocation
                ? "Sizning hududingizga hozircha xizmat ko'rsatuvchi joy topilmadi"
                : tab === "stores"
                  ? "Hozircha faol do'konlar yo'q"
                  : "Hozircha faol kafe/restoranlar yo'q"}
          </p>
          <p className="text-sm">Tez orada shu yerda ko&apos;rinadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="group overflow-hidden rounded-2xl border bg-background transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {item.bannerUrl || item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.bannerUrl ?? item.logoUrl ?? ""} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground group-hover:text-brand">
                    {tab === "stores" ? <StoreIcon className="size-8" /> : <UtensilsCrossed className="size-8" />}
                  </div>
                )}
                {item.distanceKm != null && (
                  <span className="absolute top-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur">
                    ~{item.distanceKm < 1 ? "1" : Math.round(item.distanceKm)} km
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {item.description ?? (tab === "stores" ? "Do'kon tavsifi kiritilmagan" : "Tavsif kiritilmagan")}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
