"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { placeOrder } from "@/actions/orders";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationPicker } from "@/components/location-picker";
import { formatSom } from "@/lib/format";

export function CheckoutForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const { cart, total, clearCart, hydrated } = useCart(storeSlug);
  const [pending, startTransition] = useTransition();
  const [placed, setPlaced] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await placeOrder(storeSlug, {
        items: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
        address: formData.get("address"),
        phone: formData.get("phone"),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        note: formData.get("note") || undefined,
      });
      if (result.ok) {
        clearCart();
        setPlaced(true);
        toast.success("Buyurtmangiz qabul qilindi");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (placed) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Buyurtmangiz qabul qilindi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Do&apos;kon buyurtmangizni tez orada tasdiqlaydi. Holatini kuzatish uchun buyurtmalarim bo&apos;limiga o&apos;ting.
          </p>
          <Button className="w-full" onClick={() => router.push("/")}>
            Vitrinaga qaytish
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hydrated && cart.length === 0) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Savat bo&apos;sh</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/")}>
            Mahsulotlarni ko&apos;rish
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Buyurtmani rasmiylashtirish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          {cart.map((line) => (
            <div key={line.productId} className="flex justify-between text-muted-foreground">
              <span>
                {line.name} × {line.qty}
              </span>
              <span>{formatSom(line.price * line.qty)} so&apos;m</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold text-foreground">
            <span>Jami</span>
            <span>{formatSom(total)} so&apos;m</span>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Yetkazib berish manzili</Label>
            <Textarea id="address" name="address" required />
            <LocationPicker value={coords} onChange={setCoords} height={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+998901234567" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
            <Textarea id="note" name="note" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Yuborilmoqda..." : "Buyurtma berish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
