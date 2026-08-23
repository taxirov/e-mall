import { describe, expect, it } from "vitest";
import { extractStoreSlug, isAppHost, slugify, isReservedSlug } from "./domain";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Aziz Market")).toBe("aziz-market");
  });

  it("strips apostrophes and other punctuation", () => {
    expect(slugify("Do'kon 1!")).toBe("dokon-1");
  });

  it("collapses repeated separators", () => {
    expect(slugify("A   B---C")).toBe("a-b-c");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("caps length at 40 characters", () => {
    const long = "a".repeat(60);
    expect(slugify(long)).toHaveLength(40);
  });
});

describe("isReservedSlug", () => {
  it("flags known reserved subdomains", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("app")).toBe(true);
  });

  it("allows an ordinary store slug", () => {
    expect(isReservedSlug("aziz-market")).toBe(false);
  });
});

describe("extractStoreSlug", () => {
  it("extracts the subdomain for a store on the root domain", () => {
    expect(extractStoreSlug("aziz-market.e-mall.uz")).toBe("aziz-market");
  });

  it("returns null for the bare root domain", () => {
    expect(extractStoreSlug("e-mall.uz")).toBeNull();
  });

  it("returns null for www", () => {
    expect(extractStoreSlug("www.e-mall.uz")).toBeNull();
  });

  it("returns null for reserved subdomains like app/admin", () => {
    expect(extractStoreSlug("app.e-mall.uz")).toBeNull();
    expect(extractStoreSlug("admin.e-mall.uz")).toBeNull();
  });

  it("works with a port suffix", () => {
    expect(extractStoreSlug("aziz-market.e-mall.uz:3000")).toBe("aziz-market");
  });

  it("supports local *.localhost dev hosts", () => {
    expect(extractStoreSlug("dokon.localhost:3000")).toBe("dokon");
    expect(extractStoreSlug("app.localhost:3000")).toBeNull();
  });
});

describe("isAppHost", () => {
  it("recognizes the production app host", () => {
    expect(isAppHost("app.e-mall.uz")).toBe(true);
  });

  it("recognizes the local dev app host", () => {
    expect(isAppHost("app.localhost:3000")).toBe(true);
  });

  it("rejects a store subdomain", () => {
    expect(isAppHost("aziz-market.e-mall.uz")).toBe(false);
  });
});
