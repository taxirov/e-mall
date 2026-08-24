"use server";

import { auth } from "@/auth";
import type { ActionResult } from "./auth";

const API_TOKEN = process.env.MATN_UZ_API_TOKEN;

/** Converts Uzbek Latin text to Uzbek Cyrillic via matn.uz. Any signed-in dashboard user can use it — it's a text utility, not a mutation. */
export async function transliterateToCyrillic(text: unknown): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Tizimga kirish talab qilinadi" };
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Matn kiritilmagan" };
  if (!API_TOKEN) return { ok: false, error: "Krilchaga o'tkazish xizmati sozlanmagan" };

  try {
    const res = await fetch("https://matn.uz/api/v1/cyrillic", {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, error: "Krilchaga o'tkazishda xatolik yuz berdi" };
    const result = await res.json();
    if (typeof result !== "string") return { ok: false, error: "Krilchaga o'tkazishda xatolik yuz berdi" };
    return { ok: true, data: result };
  } catch {
    return { ok: false, error: "Krilchaga o'tkazish xizmatiga ulanib bo'lmadi" };
  }
}
