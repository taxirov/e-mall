import { describe, expect, it } from "vitest";
import { computeTrend } from "./stat-card";

describe("computeTrend", () => {
  it("reports flat when both days are zero", () => {
    expect(computeTrend(0, 0)).toEqual({ direction: "flat", percent: 0 });
  });

  it("reports 'new' when yesterday was zero but today has activity", () => {
    expect(computeTrend(5, 0)).toEqual({ direction: "new", percent: 100 });
  });

  it("computes an upward percentage change", () => {
    expect(computeTrend(150, 100)).toEqual({ direction: "up", percent: 50 });
  });

  it("computes a downward percentage change", () => {
    expect(computeTrend(50, 100)).toEqual({ direction: "down", percent: 50 });
  });

  it("reports flat for an unchanged value", () => {
    expect(computeTrend(100, 100)).toEqual({ direction: "flat", percent: 0 });
  });

  it("rounds a small change to flat rather than 0%-with-a-direction", () => {
    // 100 -> 100.4 is a 0.4% increase, which rounds to 0 — should read as flat, not "up 0%".
    expect(computeTrend(1004, 1000)).toEqual({ direction: "flat", percent: 0 });
  });
});
