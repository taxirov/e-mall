import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/auth.config";
import { verifyTelegramCode } from "@/actions/telegram-verification";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
        telegramCode: { label: "Telegram kodi", type: "text" },
      },
      authorize: async (credentials) => {
        const telegramCode = credentials?.telegramCode;
        if (typeof telegramCode === "string") {
          const result = await verifyTelegramCode(telegramCode, "LOGIN");
          if (!result.ok || !result.data.userId) return null;

          const user = await prisma.user.findUnique({ where: { id: result.data.userId } });
          if (!user) return null;

          return { id: user.id, name: user.fullName, phone: user.phone, role: user.role, storeId: user.storeId };
        }

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
