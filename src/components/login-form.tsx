"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, KeyRound, Lock } from "lucide-react";
import { authenticate, authenticateWithTelegramCode } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { PasswordInput } from "@/components/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card className="w-full max-w-sm rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Tizimga kirish</CardTitle>
        <CardDescription>Xush kelibsiz — davom etish uchun kirish usulini tanlang</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all",
              mode === "password" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Lock className="size-3.5" />
            Parol bilan
          </button>
          <button
            type="button"
            onClick={() => setMode("telegram")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all",
              mode === "telegram" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Send className="size-3.5" />
            Telegram
          </button>
        </div>

        {mode === "password" ? (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam</Label>
              <PhoneInput />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <PasswordInput required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        ) : (
          <form action={handleTelegramLogin} className="space-y-4">
            <Button
              type="button"
              className="w-full bg-[#26A5E4] text-white hover:bg-[#26A5E4]/90"
              render={<a href={`https://t.me/${BOT_USERNAME}?start=login`} target="_blank" rel="noopener noreferrer" />}
            >
              <Send className="size-4" /> Telegram botga o&apos;tish
            </Button>
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-1.5">
                <KeyRound className="size-3.5" /> Kirish kodi
              </Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                maxLength={5}
                placeholder="00000"
                required
                className="h-14 text-center text-2xl font-bold tracking-[0.5em]"
              />
              <p className="text-xs text-muted-foreground">Botdan kelgan 5 xonali kodni kiriting</p>
            </div>
            {telegramError && <p className="text-sm text-destructive">{telegramError}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={telegramPending}>
              {telegramPending ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
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
