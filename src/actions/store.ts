"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { updateStoreSettingsSchema } from "@/lib/validations";
import { isReservedSlug } from "@/lib/domain";
import type { ActionResult } from "./auth";

export async function updateStoreSettings(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const parsed = updateStoreSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { name, description, slug } = parsed.data;

  if (isReservedSlug(slug)) {
    return { ok: false, error: "Bu subdomen band, boshqasini tanlang" };
  }

  const existing = await prisma.store.findUnique({ where: { slug } });
  if (existing && existing.id !== storeId) {
    return { ok: false, error: "Bu subdomen allaqachon band" };
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { name, description: description || null, slug },
  });

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/settings");
  return { ok: true, data: { slug } };
}
