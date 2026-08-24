"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireStoreMember } from "@/lib/authz";
import { catalogProductSchema, editRequestSchema } from "@/lib/validations";
import { broadcastToAdmins, broadcastToStore } from "@/lib/realtime";
import { canonicalizeLatin } from "@/lib/canonical-name";
import type { ActionResult } from "./auth";

/** Persists a catalog product's custom-attribute values (sparse — only entries actually filled in). */
export async function saveAttributeValues(catalogProductId: string, attributes?: Record<string, string>) {
  if (!attributes) return;
  const entries = Object.entries(attributes).filter(([, value]) => value !== "" && value != null);
  if (entries.length === 0) return;

  await prisma.$transaction(
    entries.map(([attributeId, value]) =>
      prisma.catalogProductAttributeValue.upsert({
        where: { catalogProductId_attributeId: { catalogProductId, attributeId } },
        create: { catalogProductId, attributeId, value },
        update: { value },
      })
    )
  );
}

export type CatalogProductSearchResult = {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
  unit: string;
  barcode: string | null;
  categoryName: string;
  imageUrl: string | null;
  createdByStoreId: string | null;
};

export async function searchCatalogProducts(query: string): Promise<CatalogProductSearchResult[]> {
  await requireStoreMember();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // Names are stored canonically in Latin — convert a Cyrillic-typed query
  // before matching, otherwise it can never find anything.
  const searchTerm = await canonicalizeLatin(trimmed);

  const items = await prisma.catalogProduct.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { brand: { contains: searchTerm, mode: "insensitive" } },
        { barcode: { contains: searchTerm } },
      ],
    },
    select: {
      id: true,
      name: true,
      brand: true,
      size: true,
      unit: true,
      barcode: true,
      imageUrl: true,
      createdByStoreId: true,
      category: { select: { name: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    size: item.size,
    unit: item.unit,
    barcode: item.barcode,
    categoryName: item.category.name,
    imageUrl: item.imageUrl,
    createdByStoreId: item.createdByStoreId,
  }));
}

/** Direct edit — only the store that created the catalog product, or Super Admin. */
export async function updateCatalogProduct(catalogProductId: string, input: unknown): Promise<ActionResult> {
  const session = await requireRole(["SUPER_ADMIN", "OWNER", "SELLER"]);
  const parsed = catalogProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.catalogProduct.findUnique({ where: { id: catalogProductId } });
  if (!existing) return { ok: false, error: "Mahsulot topilmadi" };

  const isCreatorStore = session.user.storeId && existing.createdByStoreId === session.user.storeId;
  const isAdmin = session.user.role === "SUPER_ADMIN";
  if (!isCreatorStore && !isAdmin) {
    return { ok: false, error: "Bu mahsulotni faqat uni yaratgan do'kon yoki administrator tahrirlay oladi" };
  }

  const { attributes, ...catalogData } = parsed.data;
  catalogData.name = await canonicalizeLatin(catalogData.name);
  await prisma.catalogProduct.update({ where: { id: catalogProductId }, data: catalogData });
  await saveAttributeValues(catalogProductId, attributes);
  revalidatePath("/dashboard/owner/products");
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/dashboard/pos");
  return { ok: true, data: undefined };
}

/** Admin-only: create a catalog product with no store listing attached. */
export async function createCatalogProductAsAdmin(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["SUPER_ADMIN"]);
  const parsed = catalogProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const { attributes, ...catalogData } = parsed.data;
  catalogData.name = await canonicalizeLatin(catalogData.name);
  const created = await prisma.catalogProduct.create({
    data: { ...catalogData, createdById: session.user.id },
  });
  await saveAttributeValues(created.id, attributes);
  revalidatePath("/dashboard/admin/products");
  return { ok: true, data: undefined };
}

export async function requestProductEdit(catalogProductId: string, input: unknown): Promise<ActionResult> {
  const { session, storeId } = await requireStoreMember();
  const parsed = editRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id: catalogProductId } });
  if (!catalogProduct) return { ok: false, error: "Mahsulot topilmadi" };

  const request = await prisma.productEditRequest.create({
    data: {
      catalogProductId,
      storeId,
      requestedById: session.user.id,
      changes: parsed.data.changes as never,
      note: parsed.data.note,
    },
  });
  await broadcastToAdmins("product-request:new", { requestId: request.id, productName: catalogProduct.name });
  revalidatePath("/dashboard/owner/requests");
  return { ok: true, data: undefined };
}

export async function reviewEditRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string
): Promise<ActionResult> {
  const session = await requireRole(["SUPER_ADMIN"]);

  const request = await prisma.productEditRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "So'rov topilmadi" };
  if (request.status !== "PENDING") return { ok: false, error: "Bu so'rov allaqachon ko'rib chiqilgan" };

  await prisma.$transaction(async (tx) => {
    if (decision === "APPROVED") {
      await tx.catalogProduct.update({
        where: { id: request.catalogProductId },
        data: request.changes as never,
      });
    }
    await tx.productEditRequest.update({
      where: { id: requestId },
      data: { status: decision, reviewedById: session.user.id, reviewNote, reviewedAt: new Date() },
    });
  });

  await broadcastToStore(request.storeId, "product-request:reviewed", { requestId, decision });
  revalidatePath("/dashboard/admin/requests");
  revalidatePath("/dashboard/owner/requests");
  revalidatePath("/dashboard/owner/products");
  return { ok: true, data: undefined };
}
