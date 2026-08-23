import { describe, expect, it } from "vitest";
import { computeDiscount } from "./discount";

describe("computeDiscount", () => {
  it("computes a percentage discount", () => {
    expect(computeDiscount("PERCENT", 10, 100000)).toBe(10000);
  });

  it("rounds a percentage discount to the nearest whole som", () => {
    expect(computeDiscount("PERCENT", 15, 9999)).toBe(1500); // 1499.85 -> 1500
  });

  it("computes a fixed discount", () => {
    expect(computeDiscount("FIXED", 5000, 100000)).toBe(5000);
  });

  it("clamps a fixed discount to the subtotal so a sale never goes negative", () => {
    expect(computeDiscount("FIXED", 50000, 20000)).toBe(20000);
  });

  it("clamps a percentage discount that would exceed the subtotal (100%+ value)", () => {
    expect(computeDiscount("PERCENT", 100, 30000)).toBe(30000);
  });

  it("returns 0 for a zero or negative subtotal instead of a negative discount", () => {
    expect(computeDiscount("FIXED", 5000, 0)).toBe(0);
    expect(computeDiscount("PERCENT", 10, -100)).toBe(0);
  });
});
