"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomerAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterCustomerForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, formAction, pending] = useActionState(registerCustomerAction, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Xaridor sifatida ro&apos;yxatdan o&apos;tish</CardTitle>
        <CardDescription>Do&apos;konlardan onlayn buyurtma berish uchun hisob yarating</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="fullName">To&apos;liq ismingiz</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+998901234567" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Kirish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
