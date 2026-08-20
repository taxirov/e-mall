"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import type { ActionResult } from "./auth";

export async function setStoreStatus(storeId: string, status: "ACTIVE" | "SUSPENDED" | "PENDING"): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  await prisma.store.update({ where: { id: storeId }, data: { status } });
  revalidatePath("/dashboard/admin");
  return { ok: true, data: undefined };
}
