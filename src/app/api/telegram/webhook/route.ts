import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, requestContactKeyboard, generateVerificationCode } from "@/lib/telegram";

const CODE_TTL_MS = 10 * 60 * 1000;

type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number };
    contact?: { phone_number: string };
  };
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);

  if (message.contact) {
    const code = generateVerificationCode();
    await prisma.telegramVerification.create({
      data: {
        code,
        type: "REGISTER",
        telegramChatId: chatId,
        telegramPhone: message.contact.phone_number,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });
    await sendTelegramMessage(
      chatId,
      `Tasdiqlash kodingiz: ${code}\n\nUshbu kodni saytga qaytib kiriting. Kod 10 daqiqa amal qiladi.`,
      { remove_keyboard: true }
    );
    return NextResponse.json({ ok: true });
  }

  if (message.text?.startsWith("/start")) {
    const payload = message.text.split(" ")[1];

    if (payload === "register") {
      await sendTelegramMessage(
        chatId,
        "Ro'yxatdan o'tishni yakunlash uchun telefon raqamingizni ulashing.",
        requestContactKeyboard()
      );
      return NextResponse.json({ ok: true });
    }

    if (payload === "login") {
      const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (!user) {
        await sendTelegramMessage(chatId, "Bu Telegram hisobi hech qanday akkauntga bog'lanmagan. Avval saytda ro'yxatdan o'ting.");
        return NextResponse.json({ ok: true });
      }
      const code = generateVerificationCode();
      await prisma.telegramVerification.create({
        data: {
          code,
          type: "LOGIN",
          telegramChatId: chatId,
          userId: user.id,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      });
      await sendTelegramMessage(chatId, `Kirish kodingiz: ${code}\n\nUshbu kodni saytga kiriting. Kod 10 daqiqa amal qiladi.`);
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(chatId, "Iltimos, saytdagi \"Ro'yxatdan o'tish\" yoki \"Telegram orqali kirish\" tugmasi orqali botga o'ting.");
  }

  return NextResponse.json({ ok: true });
}
