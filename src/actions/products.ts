"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { productSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import { saveAttributeValues } from "./catalog-products";
import { canonicalizeLatin } from "@/lib/canonical-name";
import type { ActionResult } from "./auth";

/**
 * Creates a store's product listing. Either attaches an existing shared
 * CatalogProduct (input.catalogProductId) or defines a brand-new one
 * (input.newCatalogProduct) — never both, enforced by productSchema.
 * The initial stock/cost/selling price/expiry doubles as the product's
 * first goods receipt, so it's recorded as a StockReceipt too (same as the
 * Ombor "Mahsulot kelishi" flow) rather than only setting Product fields.
 */
export async function createProduct(input: unknown): Promise<ActionResult> {
  const { session, storeId } = await requireStoreMember();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const data = parsed.data;

  let catalogProductId = data.catalogProductId ?? undefined;
  if (data.newCatalogProduct) {
    const { attributes, ...catalogData } = data.newCatalogProduct;
    const created = await prisma.catalogProduct.create({
      data: {
        ...catalogData,
        name: await canonicalizeLatin(catalogData.name),
        createdByStoreId: storeId,
        createdById: session.user.id,
      },
    });
    await saveAttributeValues(created.id, attributes);
    catalogProductId = created.id;
  }
  if (!catalogProductId) return { ok: false, error: "Mahsulot tanlanmadi" };

  const existingListing = await prisma.product.findUnique({
    where: { storeId_catalogProductId: { storeId, catalogProductId } },
  });
  if (existingListing) return { ok: false, error: "Bu mahsulot do'koningizda allaqachon mavjud" };

  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        storeId,
        catalogProductId,
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        expiryDate,
        isPublished: data.isPublished,
        isNew: data.isNew,
        discountPrice: data.discountPrice,
        discountEndsAt: data.discountEndsAt ? new Date(data.discountEndsAt) : null,
      },
    });

    if (data.stock > 0) {
      await tx.stockReceipt.create({
        data: {
          storeId,
          productId: product.id,
          quantity: data.stock,
          costPrice: data.costPrice ?? 0,
          sellingPrice: data.price,
          expiryDate,
          supplier: data.supplier,
          receivedById: session.user.id,
        },
      });
      await tx.inventoryLog.create({
        data: { storeId, productId: product.id, change: data.stock, reason: "RESTOCK" },
      });
    }
  });

  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/owner/warehouse");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}

export async function updateProduct(productId: string, input: unknown): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!existing) return { ok: false, error: "Mahsulot topilmadi" };

  const { sku, price, costPrice, stock, lowStockThreshold, isPublished, isNew, discountPrice } = parsed.data;
  const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;
  const discountEndsAt = parsed.data.discountEndsAt ? new Date(parsed.data.discountEndsAt) : null;

  await prisma.product.update({
    where: { id: productId },
    data: { sku, price, costPrice, stock, lowStockThreshold, expiryDate, isPublished, isNew, discountPrice, discountEndsAt },
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
    return { ok: false, error: "Bu mahsulot bo'yicha sotuv/buyurtma tarixi bor, shuning uchun o'chirib bo'lmaydi" };
  }
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}
