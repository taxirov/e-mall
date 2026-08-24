import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [store, user] = await Promise.all([
    session.user.storeId
      ? prisma.store.findUnique({ where: { id: session.user.storeId }, select: { name: true } })
      : null,
    prisma.user.findUnique({ where: { id: session.user.id }, select: { fullName: true } }),
  ]);

  return (
    <DashboardShell role={session.user.role} storeName={store?.name} userName={user?.fullName ?? ""}>
      {children}
    </DashboardShell>
  );
}
