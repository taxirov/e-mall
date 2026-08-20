import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PosScreen } from "@/components/pos-screen";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.user.storeId } });

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId, stock: { gt: 0 } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, stock: true, categoryId: true },
  });

  return (
    <PosScreen
      storeActive={store.status === "ACTIVE"}
      initialProducts={products.map((p) => ({ ...p, price: p.price.toString() }))}
    />
  );
}
