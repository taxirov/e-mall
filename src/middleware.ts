import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { extractStoreSlug } from "@/lib/domain";

// Uses the Edge-safe auth config (no Prisma) since middleware runs on the Edge runtime.
const { auth } = NextAuth(authConfig);

// Paths that must always resolve to the shared app (auth, dashboard, api),
// even when visited through a store's subdomain.
const GLOBAL_PATH_PREFIXES = ["/_next", "/api", "/dashboard", "/login", "/register", "/register-customer"];

const ROLE_PREFIXES: Record<string, string[]> = {
  "/dashboard/admin": ["SUPER_ADMIN"],
  "/dashboard/owner": ["OWNER"],
  "/dashboard/pos": ["OWNER", "SELLER"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";
  const storeSlug = extractStoreSlug(host);

  // Multi-tenant subdomain rewrite: dokon.e-mall.uz/* -> /store/dokon/*
  const isGlobalPath = GLOBAL_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  if (storeSlug && !isGlobalPath) {
    const url = nextUrl.clone();
    url.pathname = `/store/${storeSlug}${nextUrl.pathname}`;
    return NextResponse.rewrite(url);
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
