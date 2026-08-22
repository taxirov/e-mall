"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import { authenticate, authenticateWithTelegramCode } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, formAction, pending] = useActionState(authenticate, undefined);
  const [mode, setMode] = useState<"password" | "telegram">("password");
  const router = useRouter();
  const [telegramPending, startTelegramTransition] = useTransition();
  const [telegramError, setTelegramError] = useState<string | null>(null);

  function handleTelegramLogin(formData: FormData) {
    setTelegramError(null);
    const code = formData.get("code") as string;
    startTelegramTransition(async () => {
      const result = await authenticateWithTelegramCode(code);
      if (!result.ok) {
        setTelegramError(result.error);
        return;
      }
      const target = callbackUrl || result.data.redirectTo;
      if (target.startsWith("http")) {
        window.location.href = target;
      } else {
        router.push(target);
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Tizimga kirish</CardTitle>
        <CardDescription>
          {mode === "password" ? "Telefon raqam va parolingizni kiriting" : "Telegram bot orqali bir martali kod bilan kiring"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "password" ? (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam</Label>
              <PhoneInput />
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
        ) : (
          <form action={handleTelegramLogin} className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              render={<a href={`https://t.me/${BOT_USERNAME}?start=login`} target="_blank" rel="noopener noreferrer" />}
            >
              <Send className="size-4" /> Telegram botga o&apos;tish
            </Button>
            <div className="space-y-2">
              <Label htmlFor="code">Kirish kodi</Label>
              <Input id="code" name="code" inputMode="numeric" maxLength={6} placeholder="123456" required />
            </div>
            {telegramError && <p className="text-sm text-destructive">{telegramError}</p>}
            <Button type="submit" className="w-full" disabled={telegramPending}>
              {telegramPending ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "telegram" : "password")}
          className="mt-3 w-full text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          {mode === "password" ? "Telegram orqali kirish" : "Parol orqali kirish"}
        </button>

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
