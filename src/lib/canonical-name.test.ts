import { describe, expect, it } from "vitest";
import { hasCyrillic, normalizeApostrophes } from "./canonical-name";

describe("hasCyrillic", () => {
  it("is true for pure Cyrillic text", () => {
    expect(hasCyrillic("Дўкон")).toBe(true);
  });

  it("is true when Cyrillic is mixed into otherwise Latin text", () => {
    expect(hasCyrillic("Test Марket")).toBe(true);
  });

  it("is false for pure Latin text", () => {
    expect(hasCyrillic("Test Market")).toBe(false);
  });

  it("is false for digits and punctuation only", () => {
    expect(hasCyrillic("12-Market #3!")).toBe(false);
  });
});

describe("normalizeApostrophes", () => {
  it("replaces curly single quotes with a plain apostrophe", () => {
    expect(normalizeApostrophes("Do‘kon")).toBe("Do'kon");
    expect(normalizeApostrophes("Do’kon")).toBe("Do'kon");
  });

  it("replaces the modifier-letter turned comma variants", () => {
    expect(normalizeApostrophes("gʻoyat")).toBe("g'oyat");
    expect(normalizeApostrophes("gʼoyat")).toBe("g'oyat");
  });

  it("leaves plain ASCII apostrophes untouched", () => {
    expect(normalizeApostrophes("Do'kon nomi")).toBe("Do'kon nomi");
  });

  it("leaves text with no apostrophes untouched", () => {
    expect(normalizeApostrophes("Test Market")).toBe("Test Market");
  });
});
