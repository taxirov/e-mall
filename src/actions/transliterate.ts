"use server";

import type { ActionResult } from "./auth";

const API_TOKEN = process.env.MATN_UZ_API_TOKEN;
// Generous enough for a page's worth of batched UI strings (the site-wide
// script toggle) while keeping a single request from becoming unbounded —
// this is a public, unauthenticated endpoint (landing page, storefront).
const MAX_LENGTH = 20000;

/** Converts Uzbek Latin text to Uzbek Cyrillic via matn.uz. Public (no auth) — it's a stateless text utility with no database access, used both from dashboard forms and the site-wide script toggle on public pages. */
export async function transliterateToCyrillic(text: unknown): Promise<ActionResult<string>> {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Matn kiritilmagan" };
  if (text.length > MAX_LENGTH) return { ok: false, error: "Matn juda uzun" };
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
