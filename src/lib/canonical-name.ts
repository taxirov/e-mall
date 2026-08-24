import { transliterateToLatin } from "@/actions/transliterate";

const HAS_CYRILLIC = /[Ѐ-ӿ]/;
// matn.uz's Cyrillic->Latin conversion renders o'/g' with a "curly" apostrophe
// (U+2018/2019) — normalize to the plain ASCII apostrophe people actually
// type, so canonicalized and hand-typed Latin names look identical.
const CURLY_APOSTROPHES = /[‘’ʻʼ]/g;

export function hasCyrillic(text: string): boolean {
  return HAS_CYRILLIC.test(text);
}

export function normalizeApostrophes(text: string): string {
  return text.replace(CURLY_APOSTROPHES, "'");
}

/**
 * Enforces a single canonical (Latin) storage script for user-typed names —
 * if the input contains Cyrillic letters, converts it to Latin before
 * saving, so search/sort stay consistent regardless of which script a store
 * owner happened to type in. Latin input (the common case) passes through
 * untouched with no network call. Best-effort: if the transliteration
 * service hiccups, falls back to the original text rather than blocking
 * the save over a non-critical formatting concern.
 */
export async function canonicalizeLatin(text: string): Promise<string> {
  if (!hasCyrillic(text)) return text;
  const result = await transliterateToLatin(text);
  if (!result.ok) return text;
  return normalizeApostrophes(result.data);
}
