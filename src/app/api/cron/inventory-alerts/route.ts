import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Runs daily (see vercel.json crons) and Telegram-notifies each active
 * store's owner about products that are low on stock or expiring soon.
 * Vercel signs its own cron requests with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiryWindow = new Date();
  expiryWindow.setDate(expiryWindow.getDate() + 7);

  const stores = await prisma.store.findMany({
    where: { status: "ACTIVE", owner: { telegramChatId: { not: null } } },
    select: {
      id: true,
      name: true,
      owner: { select: { telegramChatId: true } },
      products: {
        where: { OR: [{ lowStockThreshold: { not: null } }, { expiryDate: { lte: expiryWindow } }] },
        select: {
          stock: true,
          lowStockThreshold: true,
          expiryDate: true,
          catalogProduct: { select: { name: true, size: true } },
        },
      },
    },
  });

  let notified = 0;
  for (const store of stores) {
    const lowStock = store.products.filter(
      (p) => p.lowStockThreshold != null && p.stock <= p.lowStockThreshold
    );
    const expiring = store.products.filter((p) => p.expiryDate && p.expiryDate <= expiryWindow);
    if (lowStock.length === 0 && expiring.length === 0) continue;

    const productLabel = (p: { catalogProduct: { name: string; size: string | null } }) =>
      p.catalogProduct.size ? `${p.catalogProduct.name}, ${p.catalogProduct.size}` : p.catalogProduct.name;

    const lines = [`📦 Ombor holati — ${store.name}`];
    if (lowStock.length > 0) {
      lines.push("", "⚠️ Kam qolgan mahsulotlar:");
      for (const p of lowStock) {
        lines.push(`• ${productLabel(p)}: ${p.stock} dona qoldi (chegara: ${p.lowStockThreshold})`);
      }
    }
    if (expiring.length > 0) {
      lines.push("", "⏳ Muddati yaqinlashgan/tugagan mahsulotlar:");
      for (const p of expiring) {
        const expired = p.expiryDate! < new Date();
        lines.push(`• ${productLabel(p)} — ${expired ? "muddati o'tgan" : `${p.expiryDate!.toLocaleDateString("uz-UZ")} gacha`}`);
      }
    }

    await sendTelegramMessage(store.owner!.telegramChatId!, lines.join("\n"));
    notified++;
  }

  return NextResponse.json({ storesChecked: stores.length, notified });
}
