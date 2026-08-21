import { prisma } from "@/lib/prisma";
import { AdminCategoriesManager } from "@/components/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminCategoriesManager
      initialCategories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))}
    />
  );
}
