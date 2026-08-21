"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { categorySchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.category.create({ data: parsed.data });
  } catch {
    return { ok: false, error: "Bu nomdagi kategoriya allaqachon mavjud" };
  }
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = categorySchema.pick({ name: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.category.update({ where: { id }, data: { name: parsed.data.name } });
  } catch {
    return { ok: false, error: "Bu nomdagi kategoriya allaqachon mavjud" };
  }
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Bu kategoriyada sub-kategoriya yoki mahsulotlar bor, shuning uchun o'chirib bo'lmaydi" };
  }
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}
