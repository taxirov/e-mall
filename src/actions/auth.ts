"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerStoreSchema } from "@/lib/validations";
import { slugify, isReservedSlug } from "@/lib/domain";
import { z } from "zod";
import { phoneSchema } from "@/lib/validations";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function registerStore(input: unknown): Promise<ActionResult<{ storeSlug: string }>> {
  const parsed = registerStoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" };
  }
  const { fullName, phone, password, storeName } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
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
      data: { fullName, phone, passwordHash, role: "OWNER" },
    });
    const store = await tx.store.create({
      data: { name: storeName, slug, ownerId: user.id, status: "PENDING" },
    });
    await tx.user.update({ where: { id: user.id }, data: { storeId: store.id } });
  });

  return { ok: true, data: { storeSlug: slug } };
}

const registerCustomerSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export async function registerCustomer(input: unknown): Promise<ActionResult> {
  const parsed = registerCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" };
  }
  const { fullName, phone, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { fullName, phone, passwordHash, role: "CUSTOMER" },
  });

  return { ok: true, data: undefined };
}
