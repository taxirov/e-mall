"use server";

import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/authz";

export type MxikSearchResult = {
  id: string;
  mxikCode: string;
  mxikName: string;
  groupName: string | null;
  unit: string | null;
};

export async function searchMxikItems(query: string): Promise<MxikSearchResult[]> {
  await requireStoreMember();

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const items = await prisma.mxikItem.findMany({
    where: {
      OR: [
        { mxikName: { contains: trimmed, mode: "insensitive" } },
        { attributeName: { contains: trimmed, mode: "insensitive" } },
        { mxikCode: { contains: trimmed } },
        { barcode: { contains: trimmed } },
      ],
    },
    select: { id: true, mxikCode: true, mxikName: true, groupName: true, unit: true },
    take: 20,
    orderBy: { mxikName: "asc" },
  });

  return items;
}
