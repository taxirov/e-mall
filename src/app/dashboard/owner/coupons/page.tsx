import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CouponsManager } from "@/components/coupons-manager";

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const coupons = await prisma.coupon.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CouponsManager
      initialCoupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value.toString(),
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        active: c.active,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      }))}
    />
  );
}
