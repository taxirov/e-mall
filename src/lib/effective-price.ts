/**
 * A product's discount only counts while `discountEndsAt` is still in the
 * future — shared by POS, storefront, and createSale so the displayed price
 * and the charged price can never disagree.
 */
export function getEffectivePrice(
  price: number,
  discountPrice: number | null | undefined,
  discountEndsAt: Date | string | null | undefined
): number {
  if (discountPrice == null || !discountEndsAt) return price;
  const endsAt = typeof discountEndsAt === "string" ? new Date(discountEndsAt) : discountEndsAt;
  if (endsAt.getTime() <= Date.now()) return price;
  return discountPrice;
}

export function isDiscountActive(
  discountPrice: number | null | undefined,
  discountEndsAt: Date | string | null | undefined
): boolean {
  if (discountPrice == null || !discountEndsAt) return false;
  const endsAt = typeof discountEndsAt === "string" ? new Date(discountEndsAt) : discountEndsAt;
  return endsAt.getTime() > Date.now();
}
