"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ServiceMode } from "./location-picker-inner";

const LocationPickerInner = dynamic(() => import("./location-picker-inner"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-lg border bg-muted" />,
});

// Roughly centers on Uzbekistan when nothing is picked yet.
const UZBEKISTAN_CENTER = { lat: 41.3775, lng: 64.5853 };

type Coords = { lat: number; lng: number };

/**
 * Center-point picker (click/drag, matching e-cafe's LocationPicker) plus a
 * service-area editor: a simple radius circle, or a freeform polygon for
 * stores/cafes that need a more precise delivery zone. Used to decide
 * whether a visitor's coordinates are "served" on the homepage discovery grid.
 */
export function LocationPicker({
  value,
  onChange,
  serviceMode,
  onServiceModeChange,
  radiusKm = null,
  onRadiusKmChange,
  polygon = [],
  onPolygonChange,
  height = 320,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  /** Omit these when the caller only needs a plain point picker (e.g. a customer's own delivery address) — the service-area editor below is hidden entirely. */
  serviceMode?: ServiceMode;
  onServiceModeChange?: (mode: ServiceMode) => void;
  radiusKm?: number | null;
  onRadiusKmChange?: (km: number | null) => void;
  polygon?: Coords[];
  onPolygonChange?: (polygon: Coords[]) => void;
  height?: number;
}) {
  const [locating, setLocating] = useState(false);
  const showServiceArea = serviceMode != null && onServiceModeChange != null;

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      <LocationPickerInner
        value={value}
        onChange={onChange}
        defaultCenter={UZBEKISTAN_CENTER}
        defaultZoom={6}
        height={height}
        mode={serviceMode ?? "radius"}
        radiusKm={radiusKm}
        polygon={polygon}
        onAddPolygonPoint={(point) => onPolygonChange?.([...polygon, point])}
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          <LocateFixed className="size-3.5" />
          {locating ? "Aniqlanmoqda..." : "Joriy joylashuvim"}
        </Button>
        {value && (
          <span className="text-xs text-muted-foreground">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Xaritada bosib yoki belgini sudrab markazni tanlang.</p>

      {showServiceArea && (
        <div className="space-y-2 rounded-md border p-3">
          <Label className="text-xs">Xizmat ko&apos;rsatish hududi</Label>
          <div className="flex items-center rounded-full border p-0.5 text-xs font-medium w-fit">
            <button
              type="button"
              onClick={() => onServiceModeChange?.("radius")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                serviceMode === "radius" ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              )}
            >
              Radius
            </button>
            <button
              type="button"
              onClick={() => onServiceModeChange?.("polygon")}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                serviceMode === "polygon" ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              )}
            >
              Poligon
            </button>
          </div>

          {serviceMode === "radius" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="masalan, 5"
                value={radiusKm ?? ""}
                onChange={(e) => onRadiusKmChange?.(e.target.value ? Number(e.target.value) : null)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">km radiusda xizmat ko&apos;rsatiladi</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Xaritada bosib nuqtalar qo&apos;shing (kamida 3 ta) — hudud chegarasini chizadi.
              </p>
              {polygon.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onPolygonChange?.([])}>
                  Tozalash
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
