"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { ReceiptData } from "@/actions/pos";
import { formatSom, formatDateTime } from "@/lib/format";

const PAYMENT_LABEL: Record<string, string> = { CASH: "Naqd", CARD: "Karta" };

/**
 * Narrow thermal-receipt-style layout for print/PDF. Deliberately carries
 * only data we actually have (store name, cashier, items, total) — no
 * fabricated Uzbek fiscal fields (STIR, fiscal mark, etc.) since this POS
 * isn't registered with the tax authority's fiscal device system.
 */
export function ReceiptPreview({ receipt }: { receipt: ReceiptData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`e-mall.uz | ${receipt.storeName} | Chek: ${receipt.receiptNumber}`, {
      margin: 1,
      width: 120,
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [receipt.storeName, receipt.receiptNumber]);

  return (
    <div data-print-target className="mx-auto w-full max-w-[300px] bg-white p-4 font-mono text-[13px] leading-snug text-black">
      <p className="text-center text-sm font-bold uppercase">{receipt.storeName}</p>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex justify-between">
        <span>Sana:</span>
        <span>{formatDateTime(receipt.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span>Kassir:</span>
        <span>{receipt.cashierName || "—"}</span>
      </div>
      <div className="flex justify-between">
        <span>Chek raqami:</span>
        <span>{receipt.receiptNumber}</span>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      {receipt.items.map((item, i) => (
        <div key={i} className="mb-1.5">
          <p>{item.name}</p>
          <div className="flex justify-between text-xs">
            <span>
              {item.qty} x {formatSom(item.price)}
            </span>
            <span>{formatSom(item.qty * item.price)} so&apos;m</span>
          </div>
        </div>
      ))}
      <div className="my-2 border-t border-dashed border-black" />
      {receipt.discountAmount > 0 && (
        <>
          <div className="flex justify-between text-xs">
            <span>Oraliq summa:</span>
            <span>{formatSom(receipt.subtotal)} so&apos;m</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Chegirma{receipt.couponCode ? ` (${receipt.couponCode})` : ""}:</span>
            <span>-{formatSom(receipt.discountAmount)} so&apos;m</span>
          </div>
        </>
      )}
      <div className="flex justify-between text-sm font-bold">
        <span>JAMI</span>
        <span>{formatSom(receipt.total)} so&apos;m</span>
      </div>
      <div className="flex justify-between">
        <span>To&apos;lov shakli:</span>
        <span>{PAYMENT_LABEL[receipt.paymentMethod]}</span>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="" className="mx-auto size-24" />
      )}
      <p className="mt-2 text-center text-xs">
        <span data-no-transliterate>e-mall.uz</span> orqali xizmat ko&apos;rsatildi
      </p>
    </div>
  );
}
