"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireStoreMember } from "@/lib/authz";
import { couponSchema } from "@/lib/validations";
import { computeDiscount } from "@/lib/discount";
import type { ActionResult } from "./auth";

export async function createCoupon(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { code, type, value, maxUses, expiresAt } = parsed.data;
  const normalizedCode = code.toUpperCase();

  const existing = await prisma.coupon.findUnique({ where: { storeId_code: { storeId, code: normalizedCode } } });
  if (existing) return { ok: false, error: "Bu kod bilan kupon allaqachon mavjud" };

  await prisma.coupon.create({
    data: {
      storeId,
      code: normalizedCode,
      type,
      value,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  revalidatePath("/dashboard/owner/coupons");
  return { ok: true, data: undefined };
}

export async function toggleCouponActive(id: string): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon || coupon.storeId !== storeId) return { ok: false, error: "Kupon topilmadi" };

  await prisma.coupon.update({ where: { id }, data: { active: !coupon.active } });
  revalidatePath("/dashboard/owner/coupons");
  return { ok: true, data: undefined };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon || coupon.storeId !== storeId) return { ok: false, error: "Kupon topilmadi" };

  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/dashboard/owner/coupons");
  return { ok: true, data: undefined };
}

export type CouponValidation =
  | { ok: true; code: string; type: "PERCENT" | "FIXED"; value: number; discountAmount: number }
  | { ok: false; error: string };

/**
 * Live-checked from the POS cart before checkout. Returns `type`/`value` (not
 * just a precomputed amount) so the cart can keep recalculating the discount
 * locally as items change, without a round-trip per keystroke — createSale
 * re-validates and applies it for real at the point of commitment.
 */
export async function validateCoupon(code: unknown, subtotal: unknown): Promise<CouponValidation> {
  const { storeId } = await requireStoreMember();

  if (typeof code !== "string" || !code.trim()) return { ok: false, error: "Kupon kodini kiriting" };
  const normalizedCode = code.trim().toUpperCase();
  const parsedSubtotal = Number(subtotal);
  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) return { ok: false, error: "Savat bo'sh" };

  const coupon = await prisma.coupon.findUnique({ where: { storeId_code: { storeId, code: normalizedCode } } });
  if (!coupon) return { ok: false, error: "Bunday kupon topilmadi" };
  if (!coupon.active) return { ok: false, error: "Bu kupon faol emas" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, error: "Bu kuponning muddati tugagan" };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Bu kupon limiti tugagan" };
  }

  const value = Number(coupon.value);
  return {
    ok: true,
    code: coupon.code,
    type: coupon.type,
    value,
    discountAmount: computeDiscount(coupon.type, value, parsedSubtotal),
  };
}
