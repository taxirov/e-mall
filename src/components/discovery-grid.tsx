"use client";

import { useEffect, useMemo, useState } from "react";
import { Store as StoreIcon, UtensilsCrossed, Search, MapPin, LocateFixed, PackageSearch, ChevronRight } from "lucide-react";
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

const LOCATION_LABEL: Record<"idle" | "locating" | "granted" | "denied", string> = {
  idle: "Joylashuvni aniqlash",
  locating: "Joylashuv aniqlanmoqda...",
  granted: "Joylashuvingiz asosida ko'rsatilmoqda",
  denied: "Joylashuvni yoqish uchun bosing",
};

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
    <div>
      <div className="sticky top-14 z-30 -mx-4 space-y-3 bg-background/95 px-4 pt-3 pb-3 backdrop-blur">
        <button
          type="button"
          onClick={requestLocation}
          className="flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:border-brand/40 sm:w-fit"
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              locationStatus === "granted" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
            )}
          >
            {locationStatus === "granted" ? <MapPin className="size-3.5" /> : <LocateFixed className="size-3.5" />}
          </span>
          <span className="truncate text-sm font-medium">{LOCATION_LABEL[locationStatus]}</span>
        </button>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Do'kon yoki kafe qidirish"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-2xl border-none bg-muted pl-11 text-base shadow-none transition-shadow focus-visible:bg-background focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-brand/30"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("stores")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-2.5 text-[13px] font-semibold transition-all sm:gap-1.5 sm:px-4 sm:text-sm",
              tab === "stores" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <StoreIcon className="size-4 shrink-0" />
            Do&apos;konlar
            <span className="text-xs font-normal text-muted-foreground">{stores.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("cafes")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-2.5 text-[13px] font-semibold transition-all sm:gap-1.5 sm:px-4 sm:text-sm",
              tab === "cafes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UtensilsCrossed className="size-4 shrink-0" />
            <span className="sm:hidden">Kafelar</span>
            <span className="hidden sm:inline">Kafe va restoranlar</span>
            <span className="text-xs font-normal text-muted-foreground">{cafes.length}</span>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageSearch className="size-6" />
          </div>
          <div>
            <p className="font-semibold">
              {search
                ? "Hech narsa topilmadi"
                : userLocation
                  ? "Sizning hududingizga hozircha xizmat ko'rsatuvchi joy topilmadi"
                  : tab === "stores"
                    ? "Hozircha faol do'konlar yo'q"
                    : "Hozircha faol kafe/restoranlar yo'q"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Tez orada shu yerda ko&apos;rinadi.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, idx) => (
            <a
              key={item.id}
              href={item.href}
              style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
              className="group flex fill-mode-backwards animate-in flex-col overflow-hidden rounded-[1.75rem] border bg-background shadow-sm duration-500 fade-in-0 slide-in-from-bottom-3 transition-all hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-2xl hover:shadow-brand/10"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {item.bannerUrl || item.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.bannerUrl ?? item.logoUrl ?? ""}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground/60">
                    {tab === "stores" ? <StoreIcon className="size-9" /> : <UtensilsCrossed className="size-9" />}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {item.distanceKm != null && (
                  <span className="absolute top-2.5 right-2.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs backdrop-blur">
                    ~{item.distanceKm < 1 ? "1" : Math.round(item.distanceKm)} km
                  </span>
                )}
                {item.bannerUrl && item.logoUrl && (
                  <div className="absolute -bottom-4 left-3 size-11 overflow-hidden rounded-full border-2 border-background bg-background shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.logoUrl} alt="" className="size-full object-cover" />
                  </div>
                )}
              </div>
              <div className={cn("flex flex-1 items-start justify-between gap-2 p-4", item.bannerUrl && item.logoUrl ? "pt-6" : "pt-3.5")}>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{item.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.description ?? (tab === "stores" ? "Do'kon tavsifi kiritilmagan" : "Tavsif kiritilmagan")}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-brand group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
