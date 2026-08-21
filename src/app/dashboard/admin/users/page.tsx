import { prisma } from "@/lib/prisma";
import { AdminUsersManager } from "@/components/admin-users-manager";

export default async function AdminUsersPage() {
  const [users, storeTypes, stores] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true } } },
    }),
    prisma.storeType.findMany({ orderBy: { name: "asc" } }),
    prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AdminUsersManager
      initialUsers={users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        storeName: u.store?.name ?? null,
      }))}
      storeTypes={storeTypes.map((t) => ({ id: t.id, name: t.name }))}
      stores={stores}
    />
  );
}
