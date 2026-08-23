"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";
import { saleSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import type { ActionResult } from "./auth";

export type ReceiptData = {
  receiptNumber: string;
  storeName: string;
  cashierName: string;
  createdAt: string;
  paymentMethod: "CASH" | "CARD";
  items: { name: string; qty: number; price: number }[];
  total: number;
};

export async function createSale(
  input: unknown
): Promise<ActionResult<{ saleId: string; receiptNumber: string; receipt: ReceiptData }>> {
  const { session, storeId } = await requireStoreMember();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { items, paymentMethod } = parsed.data;

  const [products, store] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, storeId },
      include: { catalogProduct: { select: { name: true } } },
    }),
    prisma.store.findUniqueOrThrow({ where: { id: storeId }, select: { name: true } }),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return { ok: false, error: "Mahsulot topilmadi" };
    if (product.stock < item.qty) return { ok: false, error: `"${product.catalogProduct.name}" uchun qoldiq yetarli emas` };
  }

  const total = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + Number(product.price) * item.qty;
  }, 0);

  const receiptNumber = `R-${Date.now().toString(36).toUpperCase()}`;

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        storeId,
        sellerId: session.user.id,
        total,
        paymentMethod,
        receiptNumber,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            priceAtSale: productMap.get(item.productId)!.price,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
      await tx.inventoryLog.create({
        data: { storeId, productId: item.productId, change: -item.qty, reason: "SALE" },
      });
    }

    return created;
  });

  await broadcastToStore(storeId, "sale:new", {
    saleId: sale.id,
    total: sale.total.toString(),
    receiptNumber: sale.receiptNumber,
    createdAt: sale.createdAt,
  });
  for (const item of items) {
    const remaining = (productMap.get(item.productId)!.stock) - item.qty;
    await broadcastToStore(storeId, "stock:update", { productId: item.productId, stock: remaining });
  }

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/pos");

  const receipt: ReceiptData = {
    receiptNumber: sale.receiptNumber,
    storeName: store.name,
    cashierName: session.user.name ?? "",
    createdAt: sale.createdAt.toISOString(),
    paymentMethod,
    items: items.map((item) => ({
      name: productMap.get(item.productId)!.catalogProduct.name,
      qty: item.qty,
      price: Number(productMap.get(item.productId)!.price),
    })),
    total,
  };

  return { ok: true, data: { saleId: sale.id, receiptNumber: sale.receiptNumber, receipt } };
}
