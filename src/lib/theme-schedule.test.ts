import { describe, expect, it } from "vitest";
import { resolveScheduledTheme, msUntilNextTransition } from "./theme-schedule";

const at = (h: number, m: number, s = 0) => new Date(2026, 0, 1, h, m, s);

describe("resolveScheduledTheme", () => {
  it("is light during the daytime window", () => {
    expect(resolveScheduledTheme(at(9, 0), "07:00", "19:00")).toBe("light");
    expect(resolveScheduledTheme(at(18, 59), "07:00", "19:00")).toBe("light");
  });

  it("is dark outside the daytime window", () => {
    expect(resolveScheduledTheme(at(19, 0), "07:00", "19:00")).toBe("dark");
    expect(resolveScheduledTheme(at(23, 30), "07:00", "19:00")).toBe("dark");
    expect(resolveScheduledTheme(at(6, 59), "07:00", "19:00")).toBe("dark");
  });

  it("is light exactly at the light-start boundary", () => {
    expect(resolveScheduledTheme(at(7, 0), "07:00", "19:00")).toBe("light");
  });

  it("handles a light window that wraps past midnight", () => {
    // Someone configures "light" starting late evening and "dark" starting in the morning.
    expect(resolveScheduledTheme(at(23, 0), "22:00", "06:00")).toBe("light");
    expect(resolveScheduledTheme(at(2, 0), "22:00", "06:00")).toBe("light");
    expect(resolveScheduledTheme(at(12, 0), "22:00", "06:00")).toBe("dark");
  });

  it("falls back to light for a degenerate same-time config", () => {
    expect(resolveScheduledTheme(at(12, 0), "07:00", "07:00")).toBe("light");
  });
});

describe("msUntilNextTransition", () => {
  it("counts minutes to the next same-day boundary", () => {
    const ms = msUntilNextTransition(at(6, 0), "07:00", "19:00");
    expect(ms).toBe(60 * 60 * 1000);
  });

  it("wraps to the following day once past both boundaries", () => {
    const ms = msUntilNextTransition(at(20, 0), "07:00", "19:00");
    // Next boundary is 07:00 tomorrow -> 11 hours away.
    expect(ms).toBe(11 * 60 * 60 * 1000);
  });

  it("never returns zero or negative (always at least 1s out)", () => {
    const ms = msUntilNextTransition(at(6, 59, 59), "07:00", "19:00");
    expect(ms).toBeGreaterThanOrEqual(1000);
  });
});
