"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStoreAction } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterStoreForm() {
  const [error, formAction, pending] = useActionState(registerStoreAction, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Do&apos;kon oching</CardTitle>
        <CardDescription>
          Ro&apos;yxatdan o&apos;tgach, do&apos;koningiz Super Admin tomonidan tasdiqlangach faollashadi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Do&apos;kon nomi</Label>
            <Input id="storeName" name="storeName" placeholder="Masalan: Aziz Market" required />
          </div>
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
            {pending ? "Yaratilmoqda..." : "Do'kon yaratish"}
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
