import { prisma } from "@/lib/prisma";
import { AdminStoreTypesManager } from "@/components/admin-store-types-manager";

export default async function AdminStoreTypesPage() {
  const storeTypes = await prisma.storeType.findMany({ orderBy: { name: "asc" } });

  return <AdminStoreTypesManager initialStoreTypes={storeTypes.map((t) => ({ id: t.id, name: t.name }))} />;
}
