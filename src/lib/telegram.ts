const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

type ReplyKeyboardMarkup = {
  keyboard: { text: string; request_contact?: boolean }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  remove_keyboard?: boolean;
};

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: ReplyKeyboardMarkup | { remove_keyboard: true }
) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => {});
}

export function requestContactKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

/** Generates a 5-digit numeric verification code as a zero-padded string. */
export function generateVerificationCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}
