"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { categorySchema, productSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import type { ActionResult } from "./auth";

export async function createCategory(input: unknown): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  await prisma.category.create({ data: { ...parsed.data, storeId } });
  revalidatePath("/dashboard/owner/products");
  return { ok: true, data: undefined };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  await prisma.category.deleteMany({ where: { id: categoryId, storeId } });
  revalidatePath("/dashboard/owner/products");
  return { ok: true, data: undefined };
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const { categoryId, ...rest } = parsed.data;
  await prisma.product.create({
    data: { ...rest, categoryId: categoryId || null, storeId, images: [] },
  });
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}

export async function updateProduct(productId: string, input: unknown): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!existing) return { ok: false, error: "Mahsulot topilmadi" };

  const { categoryId, ...rest } = parsed.data;
  await prisma.product.update({
    where: { id: productId },
    data: { ...rest, categoryId: categoryId || null },
  });

  if (rest.stock !== existing.stock) {
    await broadcastToStore(storeId, "stock:update", { productId, stock: rest.stock });
  }

  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  await prisma.product.deleteMany({ where: { id: productId, storeId } });
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}
