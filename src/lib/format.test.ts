import { describe, expect, it } from "vitest";
import { formatSom, formatDateTime, formatTime } from "./format";

describe("formatSom", () => {
  it("groups thousands with spaces", () => {
    expect(formatSom(1234567)).toBe("1 234 567");
  });

  it("leaves small numbers unchanged", () => {
    expect(formatSom(500)).toBe("500");
  });

  it("rounds fractional amounts", () => {
    expect(formatSom(1999.6)).toBe("2 000");
  });

  it("accepts string input (Prisma Decimal.toString())", () => {
    expect(formatSom("45000")).toBe("45 000");
  });

  it("handles zero", () => {
    expect(formatSom(0)).toBe("0");
  });
});

describe("formatDateTime", () => {
  it("formats as DD.MM.YYYY HH:MM regardless of locale", () => {
    const date = new Date(2026, 0, 5, 9, 3); // Jan 5 2026, 09:03
    expect(formatDateTime(date)).toBe("05.01.2026 09:03");
  });

  it("accepts an ISO string", () => {
    expect(formatDateTime("2026-03-15T18:45:00")).toBe("15.03.2026 18:45");
  });
});

describe("formatTime", () => {
  it("formats as HH:MM", () => {
    const date = new Date(2026, 5, 1, 23, 7);
    expect(formatTime(date)).toBe("23:07");
  });
});
