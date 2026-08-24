"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { createUserAsAdminSchema } from "@/lib/validations";
import { slugify, isReservedSlug } from "@/lib/domain";
import { canonicalizeLatin } from "@/lib/canonical-name";
import type { ActionResult } from "./auth";

/** Super Admin creating a user directly — no Telegram verification, since the admin is the trusted party here. */
export async function createUserAsAdmin(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = createUserAsAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon mavjud" };

  const passwordHash = await hashPassword(data.password);

  if (data.role === "CUSTOMER" || data.role === "SUPER_ADMIN") {
    await prisma.user.create({
      data: { fullName: data.fullName, phone: data.phone, passwordHash, role: data.role },
    });
  } else if (data.role === "OWNER") {
    const canonicalStoreName = await canonicalizeLatin(data.storeName);
    const baseSlug = slugify(canonicalStoreName) || "dokon";
    let slug = baseSlug;
    let suffix = 1;
    while (isReservedSlug(slug) || (await prisma.store.findUnique({ where: { slug } }))) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { fullName: data.fullName, phone: data.phone, passwordHash, role: "OWNER" },
      });
      const store = await tx.store.create({
        data: {
          name: canonicalStoreName,
          slug,
          ownerId: user.id,
          status: "ACTIVE",
          storeTypes: { connect: data.storeTypeIds.map((id) => ({ id })) },
        },
      });
      await tx.user.update({ where: { id: user.id }, data: { storeId: store.id } });
    });
  } else {
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });
    if (!store) return { ok: false, error: "Do'kon topilmadi" };
    await prisma.user.create({
      data: { fullName: data.fullName, phone: data.phone, passwordHash, role: "SELLER", storeId: data.storeId },
    });
  }

  revalidatePath("/dashboard/admin/users");
  return { ok: true, data: undefined };
}
