"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStoreMember } from "@/lib/authz";
import { placeOrderSchema } from "@/lib/validations";
import { broadcastToStore } from "@/lib/realtime";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";
import type { ActionResult } from "./auth";

export async function placeOrder(storeSlug: string, input: unknown): Promise<ActionResult<{ orderId: string }>> {
  if (!ONLINE_ORDERING_ENABLED) return { ok: false, error: "Onlayn buyurtma hali ishga tushirilmagan" };

  const session = await requireAuth();

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store || store.status !== "ACTIVE") return { ok: false, error: "Do'kon topilmadi" };

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { items, address, phone, note } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id, isPublished: true },
    include: { catalogProduct: { select: { name: true } } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return { ok: false, error: "Mahsulot topilmadi" };
    if (product.stock < item.qty) return { ok: false, error: `"${product.catalogProduct.name}" uchun qoldiq yetarli emas` };
  }

  const total = items.reduce((sum, item) => sum + Number(productMap.get(item.productId)!.price) * item.qty, 0);

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      customerId: session.user.id,
      total,
      address,
      phone,
      note,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          priceAtOrder: productMap.get(item.productId)!.price,
        })),
      },
    },
  });

  await broadcastToStore(store.id, "order:new", { orderId: order.id, total: order.total.toString() });

  revalidatePath("/dashboard/owner/orders");
  return { ok: true, data: { orderId: order.id } };
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function updateOrderStatus(orderId: string, status: (typeof ORDER_STATUSES)[number]): Promise<ActionResult> {
  const { storeId } = await requireStoreMember();
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Noto'g'ri holat" };

  const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
  if (!order) return { ok: false, error: "Buyurtma topilmadi" };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status } });

    if (status === "CONFIRMED" && order.status === "PENDING") {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.qty } } });
        await tx.inventoryLog.create({
          data: { storeId, productId: item.productId, change: -item.qty, reason: "ORDER" },
        });
      }
    }
  });

  revalidatePath("/dashboard/owner/orders");
  return { ok: true, data: undefined };
}
