"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { storeTypeSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function createStoreType(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = storeTypeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.storeType.create({ data: parsed.data });
  } catch {
    return { ok: false, error: "Bu nomdagi do'kon turi allaqachon mavjud" };
  }
  revalidatePath("/dashboard/admin/store-types");
  revalidatePath("/register");
  return { ok: true, data: undefined };
}

export async function updateStoreType(id: string, input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = storeTypeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.storeType.update({ where: { id }, data: parsed.data });
  } catch {
    return { ok: false, error: "Bu nomdagi do'kon turi allaqachon mavjud" };
  }
  revalidatePath("/dashboard/admin/store-types");
  revalidatePath("/register");
  return { ok: true, data: undefined };
}

export async function deleteStoreType(id: string): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  try {
    await prisma.storeType.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Bu turda kategoriyalar yoki do'konlar bor, shuning uchun o'chirib bo'lmaydi" };
  }
  revalidatePath("/dashboard/admin/store-types");
  revalidatePath("/register");
  return { ok: true, data: undefined };
}
