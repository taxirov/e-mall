"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/authz";
import { updateStoreIdentitySchema, updateStoreContactSchema } from "@/lib/validations";
import { isReservedSlug } from "@/lib/domain";
import { canonicalizeLatin } from "@/lib/canonical-name";
import type { ActionResult } from "./auth";

export async function updateStoreIdentity(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const parsed = updateStoreIdentitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { name, description, slug, logoUrl, bannerUrl } = parsed.data;

  if (isReservedSlug(slug)) {
    return { ok: false, error: "Bu subdomen band, boshqasini tanlang" };
  }

  const existing = await prisma.store.findUnique({ where: { slug } });
  if (existing && existing.id !== storeId) {
    return { ok: false, error: "Bu subdomen allaqachon band" };
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      name: await canonicalizeLatin(name),
      description: description || null,
      slug,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
    },
  });

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/settings");
  revalidatePath("/store/[slug]", "layout");
  return { ok: true, data: { slug } };
}

export async function updateStoreContact(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const storeId = session.user.storeId;
  if (!storeId) return { ok: false, error: "Do'kon topilmadi" };

  const parsed = updateStoreContactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const {
    address,
    latitude,
    longitude,
    serviceRadiusKm,
    servicePolygon,
    locationUrl,
    workingHours,
    contactPhone,
    instagramUrl,
    telegramUrl,
  } = parsed.data;

  await prisma.store.update({
    where: { id: storeId },
    data: {
      address: address || null,
      latitude,
      longitude,
      serviceRadiusKm,
      servicePolygon: servicePolygon ?? Prisma.JsonNull,
      locationUrl: locationUrl || null,
      workingHours: workingHours || null,
      contactPhone: contactPhone || null,
      instagramUrl: instagramUrl || null,
      telegramUrl: telegramUrl || null,
    },
  });

  revalidatePath("/dashboard/owner/settings");
  revalidatePath("/store/[slug]", "layout");
  revalidatePath("/");
  return { ok: true, data: undefined };
}
