"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  registerStoreSchema,
  registerCustomerSchema,
  phoneSchema,
  STORE_NAME_CHARS_REGEX,
  STORE_NAME_CHARS_HINT,
} from "@/lib/validations";
import { slugify, isReservedSlug } from "@/lib/domain";
import { broadcastToAdmins } from "@/lib/realtime";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Checked before sending the user off to the Telegram bot, so a taken phone number is caught early. */
export async function checkPhoneAvailable(phone: unknown): Promise<ActionResult> {
  const parsed = phoneSchema.safeParse(phone);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri raqam" };

  const existing = await prisma.user.findUnique({ where: { phone: parsed.data } });
  if (existing) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  return { ok: true, data: undefined };
}

export type NameAvailability =
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid"; message: string };

/** Live-checked as the store name is typed, ahead of the same slug collision `registerStore` guards against. */
export async function checkStoreNameAvailable(name: unknown): Promise<NameAvailability> {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) {
    return { status: "invalid", message: "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak" };
  }
  if (!STORE_NAME_CHARS_REGEX.test(trimmed)) {
    return { status: "invalid", message: STORE_NAME_CHARS_HINT };
  }

  const slug = slugify(trimmed);
  if (!slug || isReservedSlug(slug)) return { status: "taken" };

  const existing = await prisma.store.findFirst({
    where: { OR: [{ slug }, { name: { equals: trimmed, mode: "insensitive" } }] },
    select: { id: true },
  });
  return existing ? { status: "taken" } : { status: "available" };
}

export async function registerStore(input: unknown): Promise<ActionResult<{ storeSlug: string }>> {
  const parsed = registerStoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" };
  }
  const { fullName, phone, password, storeName, storeTypeIds, telegramChatId, telegramPhone } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  }
  const existingTelegram = await prisma.user.findUnique({ where: { telegramChatId } });
  if (existingTelegram) {
    return { ok: false, error: "Bu Telegram hisobi allaqachon boshqa foydalanuvchiga bog'langan" };
  }

  const baseSlug = slugify(storeName) || "dokon";
  let slug = baseSlug;
  let suffix = 1;
  while (isReservedSlug(slug) || (await prisma.store.findUnique({ where: { slug } }))) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { fullName, phone, passwordHash, role: "OWNER", telegramChatId, telegramPhone },
    });
    const store = await tx.store.create({
      data: {
        name: storeName,
        slug,
        ownerId: user.id,
        status: "PENDING",
        storeTypes: { connect: storeTypeIds.map((id) => ({ id })) },
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { storeId: store.id } });
  });

  await broadcastToAdmins("store:new", { name: storeName, slug, ownerName: fullName, ownerPhone: phone });

  return { ok: true, data: { storeSlug: slug } };
}

export async function registerCustomer(input: unknown): Promise<ActionResult> {
  const parsed = registerCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" };
  }
  const { fullName, phone, password, telegramChatId, telegramPhone } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  }
  const existingTelegram = await prisma.user.findUnique({ where: { telegramChatId } });
  if (existingTelegram) {
    return { ok: false, error: "Bu Telegram hisobi allaqachon boshqa foydalanuvchiga bog'langan" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { fullName, phone, passwordHash, role: "CUSTOMER", telegramChatId, telegramPhone },
  });

  return { ok: true, data: undefined };
}
