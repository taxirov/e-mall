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
