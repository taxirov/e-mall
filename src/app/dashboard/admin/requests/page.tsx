import { prisma } from "@/lib/prisma";
import { AdminEditRequests } from "@/components/admin-edit-requests";

export default async function AdminRequestsPage() {
  const requests = await prisma.productEditRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { catalogProduct: { select: { name: true } }, store: { select: { name: true } }, requestedBy: { select: { fullName: true } } },
  });

  return (
    <AdminEditRequests
      initialRequests={requests.map((r) => ({
        id: r.id,
        catalogProductName: r.catalogProduct.name,
        storeName: r.store.name,
        requestedByName: r.requestedBy.fullName,
        changes: r.changes as Record<string, unknown>,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
