import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SellerManager } from "@/components/seller-manager";

export default async function SellersPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const sellers = await prisma.user.findMany({
    where: { storeId: session.user.storeId, role: "SELLER" },
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phone: true, createdAt: true },
  });

  return (
    <SellerManager
      initialSellers={sellers.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
    />
  );
}
