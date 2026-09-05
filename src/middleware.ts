import { NextResponse, type NextRequest } from "next/server";
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
// different scope, no way for the server to tell which is which (Domain/Path
// are stripped by the browser before the Cookie header is even sent) — and
// whichever one gets read is a coin flip on every single request.
//
// Trying to clean this up on the *response* (Set-Cookie) doesn't work:
// next-auth's own internal session check runs its own independent read of
// the same ambiguous header, and if *it* happens to pick the stale cookie,
// it concludes the session is invalid and clears its OWN (good) cookie right
// back out — so the response can end up wiping the very cookie a response-side
// fix just tried to keep. The only reliable fix is to remove the ambiguity
// from the *request* before next-auth (or our own req.auth) ever reads it.
//
// Cookies with the same name and path sort oldest-first in the Cookie header
// (RFC 6265 §5.4), so the legacy cookie — created first — always appears
// before the current one. Keeping only the *last* occurrence of each
// session-cookie name reliably keeps the fresher, correct cookie and drops
// the stale one, for every read in this request (ours and next-auth's).
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function dedupeSessionCookieHeader(req: NextRequest) {
  const raw = req.headers.get("cookie");
  if (!raw) return;

  const parts = raw.split(";").map((p) => p.trim());
  let changed = false;
  let cleaned = parts;

  for (const name of SESSION_COOKIE_NAMES) {
    const matches = cleaned.filter((p) => p.startsWith(`${name}=`));
    if (matches.length > 1) {
      const last = matches[matches.length - 1];
      cleaned = [...cleaned.filter((p) => !p.startsWith(`${name}=`)), last];
      changed = true;
    }
  }

  if (changed) {
    try {
      req.headers.set("cookie", cleaned.join("; "));
      console.log("[mw-dedupe]", { changed: true, before: raw, after: req.headers.get("cookie") });
    } catch (err) {
      console.log("[mw-dedupe] mutation threw", err instanceof Error ? err.message : String(err));
    }
  }
}

const authMiddleware = auth((req) => {
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

export default function middleware(req: NextRequest, event: Parameters<typeof authMiddleware>[1]) {
  dedupeSessionCookieHeader(req);
  return authMiddleware(req, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
