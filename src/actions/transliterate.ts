"use server";

import type { ActionResult } from "./auth";

const API_TOKEN = process.env.MATN_UZ_API_TOKEN;
// matn.uz rejects any request over 1000 characters — callers batching
// multiple strings (ScriptTransliterator) are expected to chunk to this
// limit themselves; this is just the backstop.
const MAX_LENGTH = 1000;

async function callMatnUz(endpoint: "cyrillic" | "latin", text: string): Promise<ActionResult<string>> {
  if (!text.trim()) return { ok: false, error: "Matn kiritilmagan" };
  if (text.length > MAX_LENGTH) return { ok: false, error: "Matn juda uzun" };
  if (!API_TOKEN) return { ok: false, error: "Transliteratsiya xizmati sozlanmagan" };

  try {
    const res = await fetch(`https://matn.uz/api/v1/${endpoint}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[transliterate/${endpoint}] non-ok response`, res.status, body.slice(0, 500));
      return { ok: false, error: `Transliteratsiyada xatolik (${res.status})` };
    }
    const result = await res.json();
    if (typeof result !== "string") {
      console.error(`[transliterate/${endpoint}] unexpected shape`, JSON.stringify(result).slice(0, 500));
      return { ok: false, error: "Transliteratsiyada xatolik yuz berdi" };
    }
    return { ok: true, data: result };
  } catch (err) {
    console.error(`[transliterate/${endpoint}] fetch threw`, err);
    return { ok: false, error: "Transliteratsiya xizmatiga ulanib bo'lmadi" };
  }
}

/** Converts Uzbek Latin text to Uzbek Cyrillic via matn.uz. Public (no auth) — it's a stateless text utility with no database access, used both from dashboard forms and the site-wide script toggle on public pages. */
export async function transliterateToCyrillic(text: unknown): Promise<ActionResult<string>> {
  if (typeof text !== "string") return { ok: false, error: "Matn kiritilmagan" };
  return callMatnUz("cyrillic", text);
}

/** Converts Uzbek Cyrillic text to Uzbek Latin via matn.uz — the other direction, used to canonicalize save-time input to a single storage script. */
export async function transliterateToLatin(text: unknown): Promise<ActionResult<string>> {
  if (typeof text !== "string") return { ok: false, error: "Matn kiritilmagan" };
  return callMatnUz("latin", text);
}
