"use server";

import { placeCafeOrder, type PlaceCafeOrderInput, type PlaceCafeOrderResult } from "@/lib/ecafe";

/**
 * cafe-ordering.tsx is a Client Component — a direct browser fetch to
 * e-cafe.uz gets CORS-blocked (no Access-Control-Allow-Origin on its
 * public order endpoint), which surfaced as a generic connection error
 * to every customer. Routing through a Server Action makes it a
 * server-to-server call instead, same as fetchActiveCafes/fetchCafeMenu.
 */
export async function submitCafeOrder(slug: string, input: PlaceCafeOrderInput): Promise<PlaceCafeOrderResult> {
  return placeCafeOrder(slug, input);
}
