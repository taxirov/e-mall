import { prisma } from "@/lib/prisma";
import { AdminCategoriesManager } from "@/components/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const [categories, storeTypes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.storeType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminCategoriesManager
      initialCategories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        storeTypeId: c.storeTypeId,
        imageUrl: c.imageUrl,
      }))}
      storeTypes={storeTypes.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
