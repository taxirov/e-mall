"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { stockReceiptSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import type { ActionResult } from "./auth";

export async function receiveStock(input: unknown): Promise<ActionResult> {
  const { session, storeId } = await requireStoreMember();
  const parsed = stockReceiptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { productId, quantity, costPrice, sellingPrice, expiryDate, supplier } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!product) return { ok: false, error: "Mahsulot topilmadi" };

  const parsedExpiry = expiryDate ? new Date(expiryDate) : null;

  const newStock = await prisma.$transaction(async (tx) => {
    await tx.stockReceipt.create({
      data: {
        storeId,
        productId,
        quantity,
        costPrice,
        sellingPrice,
        expiryDate: parsedExpiry,
        supplier: supplier || null,
        receivedById: session.user.id,
      },
    });

    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
        price: sellingPrice,
        costPrice,
        expiryDate: parsedExpiry,
      },
    });

    await tx.inventoryLog.create({
      data: { storeId, productId, change: quantity, reason: "RESTOCK" },
    });

    return updated.stock;
  });

  await broadcastToStore(storeId, "stock:update", { productId, stock: newStock });

  revalidatePath("/dashboard/owner/warehouse");
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}
