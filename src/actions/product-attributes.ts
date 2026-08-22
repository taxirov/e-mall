"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { productAttributeSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

function revalidateProductPages() {
  revalidatePath("/dashboard/admin/attributes");
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/dashboard/owner/products");
}

export async function createProductAttribute(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = productAttributeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.productAttribute.create({
      data: { name: parsed.data.name, type: parsed.data.type, options: parsed.data.options },
    });
  } catch {
    return { ok: false, error: "Bu nomdagi maydon allaqachon mavjud" };
  }
  revalidateProductPages();
  return { ok: true, data: undefined };
}

export async function updateProductAttribute(id: string, input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = productAttributeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  try {
    await prisma.productAttribute.update({
      where: { id },
      data: { name: parsed.data.name, type: parsed.data.type, options: parsed.data.options },
    });
  } catch {
    return { ok: false, error: "Bu nomdagi maydon allaqachon mavjud" };
  }
  revalidateProductPages();
  return { ok: true, data: undefined };
}

export async function deleteProductAttribute(id: string): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  await prisma.productAttribute.delete({ where: { id } });
  revalidateProductPages();
  return { ok: true, data: undefined };
}
