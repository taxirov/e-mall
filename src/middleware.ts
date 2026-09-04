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

// Before the session cookie was scoped to all of *.e-mall.uz, it was set
// host-only (no Domain attribute) on app.e-mall.uz. A browser that logged in
// both before and after that change can end up sending BOTH — same name,
// different scope — and the server picks whichever the browser happens to
// order first, flipping between two different sessions on every request.
//
// `res.cookies.delete(name)` does NOT fix this: Next's ResponseCookies keeps
// only one entry per cookie *name* internally, and next-auth's own wrapper
// re-appends its own (Domain-scoped) session cookie to whatever this
// middleware returns — so a Map-based delete for the same name is always
// clobbered by that later append. Writing the raw Set-Cookie header via
// `.headers.append` instead bypasses that Map entirely: it becomes a
// genuinely separate header line the browser matches by its (missing)
// Domain attribute, so it can only ever clear the host-only cookie and
// never touches the real Domain-scoped one next-auth appends afterward.
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function dedupeLegacySessionCookie(res: NextResponse, cookieHeader: string): NextResponse {
  for (const name of SESSION_COOKIE_NAMES) {
    const count = cookieHeader.split(";").filter((part) => part.trim().startsWith(`${name}=`)).length;
    if (count > 1) {
      res.headers.append("set-cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`);
    }
  }
  return res;
}

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";
  const cookieHeader = req.headers.get("cookie") ?? "";
  const storeSlug = extractStoreSlug(host);
  const appHost = isAppHost(host);
  const finish = (res: NextResponse) => dedupeLegacySessionCookie(res, cookieHeader);

  // Multi-tenant subdomain rewrite: dokon.e-mall.uz/* -> /store/dokon/*
  const isGlobalPath = GLOBAL_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  if (storeSlug && !isGlobalPath) {
    const url = nextUrl.clone();
    url.pathname = `/store/${storeSlug}${nextUrl.pathname}`;
    return finish(NextResponse.rewrite(url));
  }

  // Path-based alternative to the subdomain above: e-mall.uz/mall/dokon/* ->
  // /store/dokon/* (same page/layout, just reachable without a subdomain).
  if (!storeSlug && nextUrl.pathname.startsWith("/mall/")) {
    const url = nextUrl.clone();
    url.pathname = nextUrl.pathname.replace(/^\/mall\//, "/store/");
    return finish(NextResponse.rewrite(url));
  }

  // e-mall.uz is the public landing page — auth/dashboard pages live on
  // app.e-mall.uz only, so send those requests over there.
  if (!storeSlug && !appHost) {
    const isAppOnlyPath = APP_ONLY_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
    if (isAppOnlyPath) {
      const url = new URL(`${nextUrl.pathname}${nextUrl.search}`, appOrigin(host));
      return finish(NextResponse.redirect(url));
    }
  }

  // app.e-mall.uz has no landing page of its own — "/" goes straight to login.
  if (appHost && nextUrl.pathname === "/") {
    const url = nextUrl.clone();
    url.pathname = "/login";
    return finish(NextResponse.redirect(url));
  }

  if (nextUrl.pathname.startsWith("/dashboard")) {
    // TEMPORARY diagnostic (round 3) — remove once this recurrence is confirmed fixed.
    const sessionEntries = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .filter((p) => p.toLowerCase().includes("session-token"))
      .map((p) => {
        const eq = p.indexOf("=");
        return `${p.slice(0, eq)}=…${p.slice(eq + 1).slice(-8)}`;
      });
    console.log("[mw-debug3]", {
      path: nextUrl.pathname,
      method: req.method,
      hasAuth: !!req.auth,
      role: req.auth?.user?.role,
      sessionEntries,
    });
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
      return finish(NextResponse.redirect(loginUrl));
    }
    if (!role || !allowedRoles.includes(role)) {
      const homeUrl = nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return finish(NextResponse.redirect(homeUrl));
    }
  } else if (nextUrl.pathname.startsWith("/dashboard")) {
    // any other /dashboard/* route just requires being signed in
    if (!req.auth) {
      const loginUrl = nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return finish(NextResponse.redirect(loginUrl));
    }
  }

  return finish(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
