import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config (no Prisma/bcrypt — those are
// Node-only and would break Next.js Middleware's Edge runtime). Used by
// middleware.ts to read the session; the full config with the Credentials
// provider lives in auth.ts and is used everywhere else (Node runtime).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
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
