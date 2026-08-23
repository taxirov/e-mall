export type CouponType = "PERCENT" | "FIXED";

/**
 * Shared by the POS cart (live preview as the cart changes) and createSale
 * (server-side, authoritative at checkout) so the two never disagree.
 */
export function computeDiscount(type: CouponType, value: number, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (type === "PERCENT") return Math.round((subtotal * value) / 100);
  return Math.min(value, subtotal);
}
