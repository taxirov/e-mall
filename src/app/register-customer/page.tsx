import { RegisterCustomerForm } from "@/components/register-customer-form";

export default async function RegisterCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <RegisterCustomerForm callbackUrl={callbackUrl} />
    </div>
  );
}
