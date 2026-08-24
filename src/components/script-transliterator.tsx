"use client";

import { useEffect, useRef } from "react";
import { useScript } from "@/contexts/script-context";
import { transliterateToCyrillic } from "@/actions/transliterate";

// Module-level (not per-mount) so the cache survives client-side navigation
// between pages instead of re-fetching the same handful of UI strings again.
const originalTextByNode = new WeakMap<Text, string>();
const cyrillicByLatin = new Map<string, string>();

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "TITLE"]);
const HAS_LATIN_LETTER = /[A-Za-z]/;
// Domain-ish tokens ("e-mall.uz", "matn.uz") shouldn't be transliterated —
// they're names, not UI copy.
const LOOKS_LIKE_DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
// matn.uz rejects any single request over 1000 characters — batch requests
// stay comfortably under that.
const MAX_CHUNK_CHARS = 900;

function shouldSkip(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.closest("[data-no-transliterate]")) return true;
  const text = node.textContent ?? "";
  if (!HAS_LATIN_LETTER.test(text)) return true;
  if (LOOKS_LIKE_DOMAIN.test(text.trim())) return true;
  return false;
}

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  // A single text node passed directly as `root` (e.g. from a
  // characterData mutation) isn't visited by its own TreeWalker.
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);
  let current: Node | null;
  while ((current = walker.nextNode())) nodes.push(current as Text);
  return nodes;
}

/** Greedily groups strings into newline-joined batches, each under maxChars. */
export function chunkStrings(strings: string[], maxChars: number): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLen = 0;
  for (const s of strings) {
    const extra = current.length === 0 ? s.length : s.length + 1;
    if (current.length > 0 && currentLen + extra > maxChars) {
      chunks.push(current);
      current = [s];
      currentLen = s.length;
    } else {
      current.push(s);
      currentLen += extra;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Mounted once at the app root. Walks the live DOM and swaps rendered text
 * between its original Latin and a cached Cyrillic transliteration — a
 * presentation-only layer that never touches component state or the
 * database, so toggling back is always lossless. New/changed text (real-time
 * updates, client navigation) is caught via MutationObserver and
 * transliterated on demand through the same batched server call used for
 * product names, chunked to stay under matn.uz's per-request size limit.
 */
export function ScriptTransliterator() {
  const { script } = useScript();
  const pendingRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    function restore(nodes: Text[]) {
      for (const node of nodes) {
        const original = originalTextByNode.get(node);
        if (original !== undefined && node.textContent !== original) node.textContent = original;
      }
    }

    async function applyCyrillic(nodes: Text[]) {
      const candidates = nodes.filter((n) => !shouldSkip(n));
      const toFetch: string[] = [];
      for (const node of candidates) {
        const original = originalTextByNode.get(node) ?? node.textContent ?? "";
        if (!originalTextByNode.has(node)) originalTextByNode.set(node, original);
        if (!cyrillicByLatin.has(original) && !pendingRef.current.has(original)) {
          pendingRef.current.add(original);
          toFetch.push(original);
        }
      }

      if (toFetch.length > 0) {
        const chunks = chunkStrings(toFetch, MAX_CHUNK_CHARS);
        await Promise.all(
          chunks.map(async (chunk) => {
            const result = await transliterateToCyrillic(chunk.join("\n"));
            if (result.ok) {
              const converted = result.data.split("\n");
              chunk.forEach((original, i) => cyrillicByLatin.set(original, converted[i] ?? original));
            }
          })
        );
        toFetch.forEach((original) => pendingRef.current.delete(original));
      }

      if (cancelled) return;
      for (const node of candidates) {
        const original = originalTextByNode.get(node)!;
        const translated = cyrillicByLatin.get(original);
        if (translated && node.textContent !== translated) node.textContent = translated;
      }
    }

    if (script === "cyrillic") {
      applyCyrillic(collectTextNodes(document.body));
    } else {
      restore(collectTextNodes(document.body));
    }

    const observer = new MutationObserver((mutations) => {
      if (script !== "cyrillic") return;
      const changed: Text[] = [];
      for (const mutation of mutations) {
        if (mutation.type === "characterData") changed.push(mutation.target as Text);
        mutation.addedNodes.forEach((n) => changed.push(...collectTextNodes(n)));
      }
      if (changed.length > 0) applyCyrillic(changed);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [script]);

  return null;
}
