"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthzError } from "@/lib/authz";
import { auth } from "@/auth";
import type { ActionResult } from "./auth";

/** Toggles a product in the current user's favorites. Any logged-in role can favorite — not just customers. */
export async function toggleFavorite(productId: string): Promise<ActionResult<{ favorited: boolean }>> {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthzError) return { ok: false, error: "Sevimlilarga qo'shish uchun tizimga kiring" };
    throw err;
  }

  const existing = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/favorites");
    return { ok: true, data: { favorited: false } };
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Mahsulot topilmadi" };

  await prisma.favorite.create({ data: { customerId: session.user.id, productId } });
  revalidatePath("/favorites");
  return { ok: true, data: { favorited: true } };
}

/** IDs of the current user's favorited products — cheap lookup for storefront heart icons. Empty for guests. */
export async function getFavoriteProductIds(): Promise<string[]> {
  const session = await auth();
  if (!session?.user) return [];
  const favorites = await prisma.favorite.findMany({
    where: { customerId: session.user.id },
    select: { productId: true },
  });
  return favorites.map((f) => f.productId);
}
