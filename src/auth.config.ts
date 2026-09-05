import type { NextAuthConfig } from "next-auth";
import { ROOT_DOMAIN } from "@/lib/domain";

// Edge-safe subset of the Auth.js config (no Prisma/bcrypt — those are
// Node-only and would break Next.js Middleware's Edge runtime). Used by
// middleware.ts to read the session; the full config with the Credentials
// provider lives in auth.ts and is used everywhere else (Node runtime).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  // Without this, the session cookie defaults to the exact host that set it
  // (app.e-mall.uz) — a customer who logs in there stays "logged out" on
  // e-mall.uz or {store}.e-mall.uz, which don't get sent that cookie. Only
  // applied in production: locally there's no shared real domain to scope
  // to, and Auth.js only uses the (domain-incompatible) __Host- prefix in
  // dev anyway.
  //
  // The "-v2" suffix is deliberate: browsers that logged in before this
  // domain-wide scoping existed are still holding the old host-only
  // "__Secure-authjs.session-token" cookie (no Domain attribute) alongside
  // whatever this scoped one they get now — same name, different scope,
  // and the server has no way to tell the two apart (Domain/Path aren't
  // included in the Cookie header the browser sends). Which one gets read
  // was a coin flip on every request, flipping signed-in identity mid-
  // session. Every attempt to clean that up server-side (deleting one
  // variant, deduping the incoming header, even rewriting the parsed
  // cookie jar directly) got undermined by some cache or internal request
  // reconstruction still seeing the old ambiguous pair. Renaming the
  // cookie sidesteps all of that: old browsers' stale cookie just becomes
  // inert under a name nothing reads anymore, and every fresh login starts
  // clean under the new name with no possible collision.
  ...(process.env.NODE_ENV === "production" && {
    cookies: {
      sessionToken: {
        name: "__Secure-authjs.session-token-v2",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain: `.${ROOT_DOMAIN}`,
        },
      },
    },
  }),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.storeId = user.storeId ?? null;
        token.phone = user.phone;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.storeId = (token.storeId as string | null) ?? null;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
