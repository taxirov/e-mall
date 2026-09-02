import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { extractStoreSlug, isAppHost, appOrigin } from "@/lib/domain";

// Uses the Edge-safe auth config (no Prisma) since middleware runs on the Edge runtime.
const { auth } = NextAuth(authConfig);

// Paths that must always resolve to the shared app (auth, dashboard, api),
// even when visited through a store's subdomain.
const GLOBAL_PATH_PREFIXES = [
  "/_next",
  "/api",
  "/dashboard",
  "/login",
  "/register",
  "/register-customer",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline",
];

// The subset of GLOBAL_PATH_PREFIXES that live exclusively on app.e-mall.uz —
// e-mall.uz itself is the public landing page and redirects these over.
const APP_ONLY_PATH_PREFIXES = ["/dashboard", "/login", "/register", "/register-customer"];

const ROLE_PREFIXES: Record<string, string[]> = {
  "/dashboard/admin": ["SUPER_ADMIN"],
  "/dashboard/owner": ["OWNER"],
  "/dashboard/pos": ["OWNER", "SELLER"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";
  const storeSlug = extractStoreSlug(host);
  const appHost = isAppHost(host);

  // Multi-tenant subdomain rewrite: dokon.e-mall.uz/* -> /store/dokon/*
  const isGlobalPath = GLOBAL_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  if (storeSlug && !isGlobalPath) {
    const url = nextUrl.clone();
    url.pathname = `/store/${storeSlug}${nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Path-based alternative to the subdomain above: e-mall.uz/mall/dokon/* ->
  // /store/dokon/* (same page/layout, just reachable without a subdomain).
  if (!storeSlug && nextUrl.pathname.startsWith("/mall/")) {
    const url = nextUrl.clone();
    url.pathname = nextUrl.pathname.replace(/^\/mall\//, "/store/");
    return NextResponse.rewrite(url);
  }

  // e-mall.uz is the public landing page — auth/dashboard pages live on
  // app.e-mall.uz only, so send those requests over there.
  if (!storeSlug && !appHost) {
    const isAppOnlyPath = APP_ONLY_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
    if (isAppOnlyPath) {
      const url = new URL(`${nextUrl.pathname}${nextUrl.search}`, appOrigin(host));
      return NextResponse.redirect(url);
    }
  }

  // app.e-mall.uz has no landing page of its own — "/" goes straight to login.
  if (appHost && nextUrl.pathname === "/") {
    const url = nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-gated dashboard routes
  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((p) => nextUrl.pathname.startsWith(p));
  if (matchedPrefix) {
    const allowedRoles = ROLE_PREFIXES[matchedPrefix];
    const role = req.auth?.user?.role;
    if (!req.auth) {
      const loginUrl = nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!role || !allowedRoles.includes(role)) {
      const homeUrl = nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  } else if (nextUrl.pathname.startsWith("/dashboard")) {
    // any other /dashboard/* route just requires being signed in
    if (!req.auth) {
      const loginUrl = nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
