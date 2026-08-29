import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "./geo";

describe("haversineDistanceKm", () => {
  it("is zero for the same point", () => {
    expect(haversineDistanceKm({ lat: 41.311, lng: 69.279 }, { lat: 41.311, lng: 69.279 })).toBeCloseTo(0, 5);
  });

  it("matches a known distance (Tashkent to Samarkand, ~260km)", () => {
    const tashkent = { lat: 41.2995, lng: 69.2401 };
    const samarkand = { lat: 39.6542, lng: 66.9597 };
    const distance = haversineDistanceKm(tashkent, samarkand);
    expect(distance).toBeGreaterThan(250);
    expect(distance).toBeLessThan(270);
  });

  it("is symmetric", () => {
    const a = { lat: 41.0, lng: 69.0 };
    const b = { lat: 40.5, lng: 68.5 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});
