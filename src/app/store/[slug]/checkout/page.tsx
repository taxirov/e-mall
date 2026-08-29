import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutForm } from "@/components/checkout-form";
import { ONLINE_ORDERING_ENABLED } from "@/lib/config";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!ONLINE_ORDERING_ENABLED) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Onlayn buyurtma tez orada</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Hozircha do&apos;kon faqat ko&apos;rib chiqish uchun ochiq. Onlayn buyurtma berish yaqin orada ishga tushadi.
        </CardContent>
      </Card>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Buyurtma berish uchun tizimga kiring</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button render={<Link href="/login?callbackUrl=/checkout" />} nativeButton={false}>Kirish</Button>
          <Button render={<Link href="/register-customer?callbackUrl=/checkout" />} nativeButton={false} variant="outline">
            Ro&apos;yxatdan o&apos;tish
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CheckoutForm storeSlug={slug} />;
}
