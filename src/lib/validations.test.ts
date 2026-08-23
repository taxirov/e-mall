import { describe, expect, it } from "vitest";
import { phoneSchema, barcodeSchema, couponSchema, STORE_NAME_CHARS_REGEX } from "./validations";

describe("phoneSchema", () => {
  it("accepts a well-formed Uzbek number", () => {
    expect(phoneSchema.safeParse("+998901234567").success).toBe(true);
  });

  it("rejects a number missing the +998 prefix", () => {
    expect(phoneSchema.safeParse("901234567").success).toBe(false);
  });

  it("rejects too few or too many digits", () => {
    expect(phoneSchema.safeParse("+99890123456").success).toBe(false);
    expect(phoneSchema.safeParse("+9989012345678").success).toBe(false);
  });
});

describe("barcodeSchema", () => {
  it("accepts a typical EAN-13 barcode", () => {
    expect(barcodeSchema.safeParse("5449000008046").success).toBe(true);
  });

  it("rejects non-digit characters", () => {
    expect(barcodeSchema.safeParse("544900000804A").success).toBe(false);
  });

  it("rejects codes shorter than 6 or longer than 14 digits", () => {
    expect(barcodeSchema.safeParse("12345").success).toBe(false);
    expect(barcodeSchema.safeParse("123456789012345").success).toBe(false);
  });
});

describe("STORE_NAME_CHARS_REGEX", () => {
  const isValid = (name: string) => STORE_NAME_CHARS_REGEX.test(name);

  it("allows letters, digits, spaces, and the Uzbek apostrophe", () => {
    expect(isValid("Do'kon 1")).toBe(true);
    expect(isValid("Aziz Market")).toBe(true);
  });

  it("allows a hyphen", () => {
    expect(isValid("Aziz-Market")).toBe(true);
  });

  it("rejects a dot", () => {
    expect(isValid("Test.Market")).toBe(false);
  });

  it("rejects other punctuation like @ or !", () => {
    expect(isValid("Market!")).toBe(false);
    expect(isValid("Market@Home")).toBe(false);
  });
});

describe("couponSchema", () => {
  it("accepts a valid percent coupon", () => {
    const result = couponSchema.safeParse({ code: "YANGI10", type: "PERCENT", value: 10 });
    expect(result.success).toBe(true);
  });

  it("accepts a valid fixed coupon", () => {
    const result = couponSchema.safeParse({ code: "SALE5000", type: "FIXED", value: 5000 });
    expect(result.success).toBe(true);
  });

  it("rejects a percent value over 100", () => {
    const result = couponSchema.safeParse({ code: "TOOMUCH", type: "PERCENT", value: 150 });
    expect(result.success).toBe(false);
  });

  it("allows a fixed value over 100 (not a percentage)", () => {
    const result = couponSchema.safeParse({ code: "BIGDEAL", type: "FIXED", value: 150000 });
    expect(result.success).toBe(true);
  });

  it("rejects a code with spaces or symbols", () => {
    expect(couponSchema.safeParse({ code: "NOT A CODE!", type: "FIXED", value: 1000 }).success).toBe(false);
  });

  it("rejects a code shorter than 3 characters", () => {
    expect(couponSchema.safeParse({ code: "AB", type: "FIXED", value: 1000 }).success).toBe(false);
  });
});
