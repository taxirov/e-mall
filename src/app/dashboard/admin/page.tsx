import { prisma } from "@/lib/prisma";
import { StoreStatusActions } from "@/components/store-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACTIVE: "Faol",
  SUSPENDED: "Bloklangan",
};

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { fullName: true, phone: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Do&apos;konlar</h1>

      <div className="grid gap-3">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{store.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  <span data-no-transliterate>{store.slug}</span> · {store.owner.fullName} · {store.owner.phone}
                </p>
              </div>
              <Badge
                variant={store.status === "ACTIVE" ? "default" : store.status === "SUSPENDED" ? "destructive" : "secondary"}
              >
                {STATUS_LABEL[store.status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <StoreStatusActions storeId={store.id} status={store.status} />
            </CardContent>
          </Card>
        ))}

        {stores.length === 0 && <p className="text-sm text-muted-foreground">Hozircha do&apos;konlar yo&apos;q.</p>}
      </div>
    </div>
  );
}
