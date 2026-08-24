"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { broadcastToStore } from "@/lib/realtime";
import type { ActionResult } from "./auth";

/** Partial or full return against a Sale — restores stock and records the refund without mutating the original Sale (receipts stay historically accurate). */
export async function createReturn(
  saleId: string,
  items: { saleItemId: string; qty: number }[]
): Promise<ActionResult<{ amount: number }>> {
  const { session, storeId } = await requireStoreMember();

  const requested = items.filter((i) => i.qty > 0);
  if (requested.length === 0) return { ok: false, error: "Qaytarish uchun miqdor kiritilmadi" };

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, storeId },
    include: { items: { include: { returnItems: true } } },
  });
  if (!sale) return { ok: false, error: "Sotuv topilmadi" };

  const saleItemMap = new Map(sale.items.map((si) => [si.id, si]));
  let amount = 0;
  const toProcess: { saleItemId: string; productId: string; qty: number }[] = [];
  for (const item of requested) {
    const saleItem = saleItemMap.get(item.saleItemId);
    if (!saleItem) return { ok: false, error: "Mahsulot ushbu sotuvda topilmadi" };
    const alreadyReturned = saleItem.returnItems.reduce((sum, ri) => sum + ri.qty, 0);
    const remaining = saleItem.qty - alreadyReturned;
    if (item.qty > remaining) {
      return { ok: false, error: "Qaytarish miqdori qolgan (sotilgan - avval qaytarilgan) miqdordan oshib ketdi" };
    }
    amount += Number(saleItem.priceAtSale) * item.qty;
    toProcess.push({ saleItemId: item.saleItemId, productId: saleItem.productId, qty: item.qty });
  }

  const updatedStocks = await prisma.$transaction(async (tx) => {
    await tx.return.create({
      data: {
        saleId,
        storeId,
        processedById: session.user.id,
        amount,
        items: { create: toProcess.map((p) => ({ saleItemId: p.saleItemId, qty: p.qty })) },
      },
    });

    const stocks: { productId: string; stock: number }[] = [];
    for (const p of toProcess) {
      const updated = await tx.product.update({ where: { id: p.productId }, data: { stock: { increment: p.qty } } });
      stocks.push({ productId: p.productId, stock: updated.stock });
      await tx.inventoryLog.create({ data: { storeId, productId: p.productId, change: p.qty, reason: "RETURN" } });
    }
    return stocks;
  });

  for (const s of updatedStocks) {
    await broadcastToStore(storeId, "stock:update", { productId: s.productId, stock: s.stock });
  }

  revalidatePath("/dashboard/owner/sales");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/warehouse");
  revalidatePath("/dashboard/pos");

  return { ok: true, data: { amount } };
}
