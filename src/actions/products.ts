"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { productSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import { resolveMxikImage } from "@/lib/mxik-images";
import type { ActionResult } from "./auth";

/** Category comes from the MXIK item's group, not typed by the owner — reuses an existing one or creates it. */
async function resolveCategoryId(storeId: string, groupName: string | null): Promise<string | null> {
  if (!groupName) return null;
  const category = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: groupName } },
    update: {},
    create: { storeId, name: groupName },
  });
  return category.id;
}

/** The photo is looked up from soliq.uz once per MXIK item and cached — every store selling the same item reuses it. */
async function resolveProductImages(mxikItem: {
  id: string;
  mxikCode: string;
  imageUrl: string | null;
  imageCheckedAt: Date | null;
}): Promise<string[]> {
  if (mxikItem.imageCheckedAt) return mxikItem.imageUrl ? [mxikItem.imageUrl] : [];

  const imageUrl = await resolveMxikImage(mxikItem.mxikCode);
  await prisma.mxikItem.update({
    where: { id: mxikItem.id },
    data: { imageUrl, imageCheckedAt: new Date() },
  });
  return imageUrl ? [imageUrl] : [];
}

export async function createProduct(input: unknown): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const mxikItem = await prisma.mxikItem.findUnique({ where: { id: parsed.data.mxikItemId } });
  if (!mxikItem) return { ok: false, error: "Tanlangan mahsulot katalogda topilmadi" };

  // Run sequentially, not Promise.all — concurrent queries on the shared
  // Prisma connection can trip prepared-statement handling on some pooled
  // Postgres setups.
  const categoryId = await resolveCategoryId(storeId, mxikItem.groupName);
  const images = await resolveProductImages(mxikItem);

  await prisma.product.create({
    data: { ...parsed.data, categoryId, storeId, images },
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

  // mxikItemId/categoryId are derived from the catalog, not editable — left as-is.
  const { name, sku, price, stock, isPublished } = parsed.data;
  await prisma.product.update({
    where: { id: productId },
    data: { name, sku, price, stock, isPublished },
  });

  if (stock !== existing.stock) {
    await broadcastToStore(storeId, "stock:update", { productId, stock });
  }

  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  try {
    await prisma.product.deleteMany({ where: { id: productId, storeId } });
  } catch {
    // Sales/orders/stock receipts reference this product and block deletion.
    return { ok: false, error: "Bu mahsulot bo'yicha sotuv/buyurtma tarixi bor, shuning uchun o'chirib bo'lmaydi" };
  }
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}
