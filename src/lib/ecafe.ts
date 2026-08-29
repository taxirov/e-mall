const ECAFE_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ECAFE_ROOT_DOMAIN ?? "e-cafe.uz";

export type EcafeCafe = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
  servicePolygon: { lat: number; lng: number }[] | null;
};

/**
 * e-cafe.uz is a separate app/database — this is a best-effort read from its
 * public directory API. Never throws: if e-cafe is unreachable or returns
 * something unexpected, the homepage should still render with just stores
 * rather than break entirely over a sibling service being down.
 */
export async function fetchActiveCafes(): Promise<EcafeCafe[]> {
  try {
    const res = await fetch(`https://${ECAFE_ROOT_DOMAIN}/api/public/cafes`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.cafes) ? data.cafes : [];
  } catch (err) {
    console.error("[ecafe] failed to fetch active cafes", err);
    return [];
  }
}

export function cafeOrigin(slug: string): string {
  return `https://${slug}.${ECAFE_ROOT_DOMAIN}`;
}

export type EcafeMenuItemVariant = { id: string; name: string; price: number };

export type EcafeMenuItem = {
  id: string;
  dishId: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  prepTimeMin: number | null;
  variants: EcafeMenuItemVariant[];
};

export type EcafeMenuCategory = { id: string; name: string; items: EcafeMenuItem[] };

export type EcafeCafeMenu = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  workingHours: string | null;
  deliveryFee: number;
  minOrderTotal: number;
  categories: EcafeMenuCategory[];
};

/** Menu for a single cafe, or null if the cafe doesn't exist / isn't active. */
export async function fetchCafeMenu(slug: string): Promise<EcafeCafeMenu | null> {
  try {
    const res = await fetch(`https://${ECAFE_ROOT_DOMAIN}/api/public/cafes/${slug}/menu`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[ecafe] failed to fetch cafe menu", err);
    return null;
  }
}

export type PlaceCafeOrderInput = {
  items: { menuItemId: string; variantId?: string | null; qty: number; note?: string | null }[];
  customerName: string;
  customerPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  note?: string | null;
};

export type PlaceCafeOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/** Places a delivery order against a cafe — e-cafe re-derives prices from its own DB, so nothing here is trusted for money. */
export async function placeCafeOrder(slug: string, input: PlaceCafeOrderInput): Promise<PlaceCafeOrderResult> {
  try {
    const res = await fetch(`https://${ECAFE_ROOT_DOMAIN}/api/public/cafes/${slug}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error ?? "Buyurtma yuborilmadi" };
    return { ok: true, orderId: data.orderId };
  } catch (err) {
    console.error("[ecafe] failed to place cafe order", err);
    return { ok: false, error: "Kafe bilan bog'lanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring" };
  }
}
