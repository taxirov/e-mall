"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { categorySchema } from "@/lib/validations";
import type { ActionResult } from "./auth";
import type { NameAvailability } from "./auth";

/**
 * Live-checked as the category name is typed. Uniqueness is scoped to the
 * parent (`@@unique([parentId, name])`), so the same name is fine under a
 * different parent — that's why parentId must be passed in too.
 */
export async function checkCategoryNameAvailable(name: unknown, parentId: unknown): Promise<NameAvailability> {
  await requireRole(["SUPER_ADMIN"]);
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 1) return { status: "invalid", message: "Nomi kiritilishi shart" };
  const parent = typeof parentId === "string" && parentId ? parentId : null;

  const existing = await prisma.category.findFirst({
    where: { parentId: parent, name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  return existing ? { status: "taken" } : { status: "available" };
}

export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { name, parentId, imageUrl } = parsed.data;
  let { storeTypeId } = parsed.data;

  // Sub-categories always inherit their parent's store type — never trust
  // a client-supplied storeTypeId that might not match the parent's.
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) return { ok: false, error: "Ota-kategoriya topilmadi" };
    storeTypeId = parent.storeTypeId;
  }

  try {
    await prisma.category.create({ data: { name, parentId, storeTypeId, imageUrl } });
  } catch {
    return { ok: false, error: "Bu nomdagi kategoriya allaqachon mavjud" };
  }
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = categorySchema.pick({ name: true, imageUrl: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.category.update({ where: { id }, data: parsed.data });
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
