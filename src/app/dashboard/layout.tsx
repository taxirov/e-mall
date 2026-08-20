import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const store = session.user.storeId
    ? await prisma.store.findUnique({ where: { id: session.user.storeId }, select: { name: true } })
    : null;

  return (
    <DashboardShell role={session.user.role} storeName={store?.name} userName={session.user.name ?? ""}>
      {children}
    </DashboardShell>
  );
}
