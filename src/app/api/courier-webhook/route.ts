import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastToStore } from "@/lib/realtime";

/** Receives delivery status updates from e-courier.uz for orders this app dispatched. */
export async function POST(request: Request) {
  const provided = request.headers.get("x-webhook-secret");
  const expected = process.env.ECOURIER_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const body = (await request.json()) as {
    externalOrderId?: string;
    status?: string;
    courierName?: string | null;
    courierPhone?: string | null;
  };
  if (!body.externalOrderId || !body.status) {
    return NextResponse.json({ error: "externalOrderId and status are required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: body.externalOrderId },
    select: { id: true, storeId: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      courierStatus: body.status,
      courierName: body.courierName ?? undefined,
      courierPhone: body.courierPhone ?? undefined,
    },
  });

  await broadcastToStore(order.storeId, "order:updated", { orderId: order.id, courierStatus: body.status });

  return NextResponse.json({ ok: true });
}
