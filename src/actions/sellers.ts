"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { inviteSellerSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function inviteSeller(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const parsed = inviteSellerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { fullName, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon mavjud" };

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { fullName, phone, passwordHash, role: "SELLER", storeId },
  });

  revalidatePath("/dashboard/owner/sellers");
  return { ok: true, data: undefined };
}

export async function removeSeller(sellerId: string): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  await prisma.user.deleteMany({ where: { id: sellerId, storeId, role: "SELLER" } });
  revalidatePath("/dashboard/owner/sellers");
  return { ok: true, data: undefined };
}
