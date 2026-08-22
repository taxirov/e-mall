"use server";

import { barcodeSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export type SoliqLookupResult = {
  soliqId: string;
  soliqPosition: string;
  soliqBrand: string;
  mxikCode: string;
  barcode: string;
  suggestedName: string;
};

type SoliqApiResponse = {
  success: boolean;
  data?: Array<{
    id?: string;
    position?: string;
    brand?: string;
    mxikCode?: string;
    internationalCode?: string;
  }>;
};

/** Strips the MXIK numeric-code prefix (e.g. "02202002001010-COCA-COLA" -> "COCA-COLA"). */
function parseBrandName(raw: string): string {
  return raw.replace(/^\d+-/, "").trim();
}

/**
 * Looks up a product by barcode against Soliq's public MXIK classifier
 * (tasnif.soliq.uz), used to pre-fill a new catalog product's brand/MXIK
 * fields instead of typing them by hand. Quantity/size is never sourced from
 * here — the store always enters that manually.
 */
export async function lookupBarcode(barcode: unknown): Promise<ActionResult<SoliqLookupResult>> {
  const parsed = barcodeSchema.safeParse(barcode);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri shtrix-kod" };

  let json: SoliqApiResponse;
  try {
    const res = await fetch(
      `https://tasnif.soliq.uz/api/cls-api/attribute/web-katalog?lang=uz_latn&pageNo=0&pageSize=10&mnnName=&internalCode=${encodeURIComponent(parsed.data)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    console.log("[soliq] status", res.status);
    json = await res.json();
  } catch (err) {
    console.error("[soliq] fetch failed:", err);
    return { ok: false, error: "Soliq tizimiga ulanib bo'lmadi, birozdan so'ng qayta urinib ko'ring" };
  }

  const item = json?.success ? json.data?.[0] : undefined;
  if (!item) return { ok: false, error: "Bu shtrix-kod bo'yicha mahsulot topilmadi" };

  const soliqBrand = item.brand ?? "";
  return {
    ok: true,
    data: {
      soliqId: item.id ?? "",
      soliqPosition: item.position ?? "",
      soliqBrand,
      mxikCode: item.mxikCode ?? "",
      barcode: item.internationalCode ?? parsed.data,
      suggestedName: parseBrandName(soliqBrand),
    },
  };
}
