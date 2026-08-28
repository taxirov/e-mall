import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminSettings } from "@/components/admin-settings";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { fullName: true, phone: true } });
  if (!user) redirect("/login");

  return <AdminSettings userFullName={user.fullName} userPhone={user.phone} />;
}
