"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "./auth";

export type TelegramVerifyResult = {
  telegramChatId: string;
  telegramPhone: string | null;
  userId: string | null;
};

/**
 * Consumes a Telegram-issued verification code. REGISTER codes carry the
 * chat id + phone Telegram reported; LOGIN codes carry the already-linked
 * userId. Single-use — the row is deleted once matched, regardless of type.
 */
export async function verifyTelegramCode(
  code: string,
  expectedType: "REGISTER" | "LOGIN"
): Promise<ActionResult<TelegramVerifyResult>> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, error: "Kod 6 xonali raqamdan iborat bo'lishi kerak" };
  }

  const record = await prisma.telegramVerification.findUnique({ where: { code: trimmed } });
  if (!record || record.type !== expectedType) {
    return { ok: false, error: "Kod noto'g'ri yoki muddati o'tgan" };
  }
  if (record.expiresAt < new Date()) {
    await prisma.telegramVerification.delete({ where: { id: record.id } });
    return { ok: false, error: "Kod muddati o'tgan, botdan qayta kod oling" };
  }

  await prisma.telegramVerification.delete({ where: { id: record.id } });

  return {
    ok: true,
    data: {
      telegramChatId: record.telegramChatId,
      telegramPhone: record.telegramPhone,
      userId: record.userId,
    },
  };
}
