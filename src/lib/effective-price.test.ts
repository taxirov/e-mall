import { describe, expect, it } from "vitest";
import { getEffectivePrice, isDiscountActive } from "./effective-price";

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

describe("getEffectivePrice", () => {
  it("returns the discount price while it's still active", () => {
    expect(getEffectivePrice(10000, 8000, future)).toBe(8000);
  });

  it("returns the regular price once the discount has expired", () => {
    expect(getEffectivePrice(10000, 8000, past)).toBe(10000);
  });

  it("returns the regular price when no discount is set", () => {
    expect(getEffectivePrice(10000, null, null)).toBe(10000);
    expect(getEffectivePrice(10000, null, future)).toBe(10000);
  });

  it("returns the regular price when a discount price exists but no end date was set", () => {
    expect(getEffectivePrice(10000, 8000, null)).toBe(10000);
  });
});

describe("isDiscountActive", () => {
  it("is true for a future end date with a discount price", () => {
    expect(isDiscountActive(8000, future)).toBe(true);
  });

  it("is false once expired", () => {
    expect(isDiscountActive(8000, past)).toBe(false);
  });

  it("is false with no discount price", () => {
    expect(isDiscountActive(null, future)).toBe(false);
  });
});
