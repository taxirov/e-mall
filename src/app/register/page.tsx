import { prisma } from "@/lib/prisma";
import { RegisterStoreForm } from "@/components/register-store-form";

export default async function RegisterPage() {
  const storeTypes = await prisma.storeType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <RegisterStoreForm storeTypes={storeTypes.map((t) => ({ id: t.id, name: t.name }))} />
    </div>
  );
}
