import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
      },
      authorize: async (credentials) => {
        const phone = credentials?.phone;
        const password = credentials?.password;
        if (typeof phone !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.fullName,
          phone: user.phone,
          role: user.role,
          storeId: user.storeId,
        };
      },
    }),
  ],
});
