import { prisma } from "@/lib/prisma";
import { RegisterStoreForm } from "@/components/register-store-form";
import { AuthShell } from "@/components/auth-shell";

export default async function RegisterPage() {
  const storeTypes = await prisma.storeType.findMany({ orderBy: { name: "asc" } });

  return (
    <AuthShell>
      <RegisterStoreForm storeTypes={storeTypes.map((t) => ({ id: t.id, name: t.name }))} />
    </AuthShell>
  );
}
