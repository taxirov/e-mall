import { RegisterCustomerForm } from "@/components/register-customer-form";
import { AuthShell } from "@/components/auth-shell";

export default async function RegisterCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthShell>
      <RegisterCustomerForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
