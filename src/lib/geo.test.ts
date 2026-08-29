import { describe, expect, it } from "vitest";
import { haversineDistanceKm, isWithinRadius, isPointInPolygon } from "./geo";

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

describe("isWithinRadius", () => {
  const center = { lat: 41.2995, lng: 69.2401 };

  it("is true for the exact center", () => {
    expect(isWithinRadius(center, center, 1)).toBe(true);
  });

  it("is true for a point safely inside the radius", () => {
    const nearby = { lat: 41.305, lng: 69.245 };
    expect(isWithinRadius(nearby, center, 10)).toBe(true);
  });

  it("is false for a point well outside the radius", () => {
    const samarkand = { lat: 39.6542, lng: 66.9597 };
    expect(isWithinRadius(samarkand, center, 10)).toBe(false);
  });
});

describe("isPointInPolygon", () => {
  // A simple square around Tashkent city center.
  const square = [
    { lat: 41.2, lng: 69.1 },
    { lat: 41.2, lng: 69.4 },
    { lat: 41.4, lng: 69.4 },
    { lat: 41.4, lng: 69.1 },
  ];

  it("is true for a point inside the square", () => {
    expect(isPointInPolygon({ lat: 41.3, lng: 69.25 }, square)).toBe(true);
  });

  it("is false for a point outside the square", () => {
    expect(isPointInPolygon({ lat: 39.6542, lng: 66.9597 }, square)).toBe(false);
  });

  it("is false when fewer than 3 vertices are given", () => {
    expect(isPointInPolygon({ lat: 41.3, lng: 69.25 }, [{ lat: 41.2, lng: 69.1 }])).toBe(false);
  });
});
