"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Tizimga kirish</CardTitle>
        <CardDescription>Telefon raqam va parolingizni kiriting</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+998901234567" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Do&apos;kon oching
          </Link>{" "}
          yoki{" "}
          <Link href="/register-customer" className="font-medium text-foreground underline underline-offset-4">
            xaridor sifatida ro&apos;yxatdan o&apos;ting
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
