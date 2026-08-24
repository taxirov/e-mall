import { describe, expect, it } from "vitest";
import { chunkStrings } from "./script-transliterator";

describe("chunkStrings", () => {
  it("keeps small strings in a single chunk", () => {
    expect(chunkStrings(["Kirish", "Chiqish", "Saqlash"], 900)).toEqual([["Kirish", "Chiqish", "Saqlash"]]);
  });

  it("splits into multiple chunks once the joined length would exceed the limit", () => {
    // "aaaaaaaaaa" (10 chars) x3 + 2 separators = 32 chars, over a limit of 25.
    const strings = ["a".repeat(10), "b".repeat(10), "c".repeat(10)];
    const chunks = chunkStrings(strings, 25);
    expect(chunks.length).toBeGreaterThan(1);
    // Every chunk, when joined with "\n" (matching how the caller sends it), must respect the limit.
    for (const chunk of chunks) {
      expect(chunk.join("\n").length).toBeLessThanOrEqual(25);
    }
  });

  it("never drops or duplicates a string across chunks", () => {
    const strings = Array.from({ length: 50 }, (_, i) => `mahsulot-nomi-${i}`);
    const chunks = chunkStrings(strings, 100);
    expect(chunks.flat()).toEqual(strings);
  });

  it("still produces a chunk for a single string longer than the limit, rather than dropping it", () => {
    const long = "a".repeat(2000);
    const chunks = chunkStrings([long], 900);
    expect(chunks).toEqual([[long]]);
  });

  it("returns an empty array for no input", () => {
    expect(chunkStrings([], 900)).toEqual([]);
  });
});
