import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-time maintenance endpoint: deletes every non-SUPER_ADMIN user and
 * everything scoped to their stores (products, sales, orders, etc.),
 * reassigning the shared CatalogProduct catalog's createdById to a
 * remaining Super Admin rather than deleting it (it's cross-store reference
 * data, not user data). Deletes are ordered leaf-to-root inside a single
 * transaction so no foreign-key constraint fires mid-way, and the whole
 * thing rolls back atomically on any failure. Refuses to run if no
 * SUPER_ADMIN would be left standing.
 */
export async function POST(request: Request) {
  const provided = request.headers.get("x-purge-secret");
  const expected = process.env.ADMIN_PURGE_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Invalid purge secret" }, { status: 401 });
  }

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!admin) {
    return NextResponse.json({ error: "No SUPER_ADMIN found — refusing to purge" }, { status: 400 });
  }

  const [
    returnItems,
    returns,
    saleItems,
    orderItems,
    inventoryLogs,
    stockReceipts,
    productEditRequests,
    sales,
    orders,
    products,
    coupons,
    catalogProducts,
    stores,
    telegramVerifications,
    users,
  ] = await prisma.$transaction([
    prisma.returnItem.deleteMany({}),
    prisma.return.deleteMany({}),
    prisma.saleItem.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.inventoryLog.deleteMany({}),
    prisma.stockReceipt.deleteMany({}),
    prisma.productEditRequest.deleteMany({}),
    prisma.sale.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.coupon.deleteMany({}),
    prisma.catalogProduct.updateMany({ where: { createdById: { not: admin.id } }, data: { createdById: admin.id } }),
    prisma.store.deleteMany({}),
    prisma.telegramVerification.deleteMany({}),
    prisma.user.deleteMany({ where: { role: { not: "SUPER_ADMIN" } } }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      returnItems: returnItems.count,
      returns: returns.count,
      saleItems: saleItems.count,
      orderItems: orderItems.count,
      inventoryLogs: inventoryLogs.count,
      stockReceipts: stockReceipts.count,
      productEditRequests: productEditRequests.count,
      sales: sales.count,
      orders: orders.count,
      products: products.count,
      coupons: coupons.count,
      stores: stores.count,
      telegramVerifications: telegramVerifications.count,
      users: users.count,
    },
    catalogProductsReassigned: catalogProducts.count,
    remainingSuperAdmin: { id: admin.id, phone: admin.phone },
  });
}
