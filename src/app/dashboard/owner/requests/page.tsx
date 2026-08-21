import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  APPROVED: "Tasdiqlandi",
  REJECTED: "Rad etildi",
};

export default async function OwnerRequestsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const requests = await prisma.productEditRequest.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
    include: { catalogProduct: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mening so&apos;rovlarim</h1>
      <div className="grid gap-3">
        {requests.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{r.catalogProduct.name}</CardTitle>
              <Badge variant={r.status === "APPROVED" ? "default" : r.status === "REJECTED" ? "destructive" : "secondary"}>
                {STATUS_LABEL[r.status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
              {r.reviewNote && <p className="mt-1 text-sm text-muted-foreground italic">&quot;{r.reviewNote}&quot;</p>}
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && <p className="text-sm text-muted-foreground">Hozircha so&apos;rovlar yo&apos;q</p>}
      </div>
    </div>
  );
}
