import { prisma } from "@/lib/prisma";
import { AdminAttributesManager } from "@/components/admin-attributes-manager";

export default async function AdminAttributesPage() {
  const attributes = await prisma.productAttribute.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminAttributesManager
      initialAttributes={attributes.map((a) => ({ id: a.id, name: a.name, type: a.type, options: a.options }))}
    />
  );
}
