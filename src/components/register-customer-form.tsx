"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send, KeyRound } from "lucide-react";
import { checkPhoneAvailable } from "@/actions/auth";
import { completeCustomerRegistration } from "@/actions/session";
import { verifyTelegramCode } from "@/actions/telegram-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { PasswordInput } from "@/components/password-input";
import { StepIndicator } from "@/components/step-indicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

type Step1Data = { fullName: string; phone: string; password: string };

export function RegisterCustomerForm({ callbackUrl }: { callbackUrl?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  function handleStep1(formData: FormData) {
    setError(null);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!phone || phone.length < 13) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }

    startTransition(async () => {
      const result = await checkPhoneAvailable(phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep1Data({ fullName, phone, password });
      setStep(2);
    });
  }

  function handleStep2(formData: FormData) {
    if (!step1Data) return;
    setError(null);
    const code = formData.get("code") as string;

    startTransition(async () => {
      const verifyResult = await verifyTelegramCode(code, "REGISTER");
      if (!verifyResult.ok) {
        setError(verifyResult.error);
        return;
      }
      const resultError = await completeCustomerRegistration(
        {
          ...step1Data,
          telegramChatId: verifyResult.data.telegramChatId,
          telegramPhone: verifyResult.data.telegramPhone,
        },
        callbackUrl
      );
      if (resultError) setError(resultError);
    });
  }

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Xaridor sifatida ro&apos;yxatdan o&apos;tish</CardTitle>
        <CardDescription>
          {step === 1
            ? "Do'konlardan onlayn buyurtma berish uchun hisob yarating"
            : "Telegram bot orqali tasdiqlashni yakunlang."}
        </CardDescription>
        <StepIndicator step={step} labels={["Ma'lumotlar", "Tasdiqlash"]} />
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <form action={handleStep1} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">To&apos;liq ismingiz</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam</Label>
              <PhoneInput checkAvailability />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <PasswordInput minLength={6} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Tekshirilmoqda..." : "Davom etish"}
            </Button>
          </form>
        ) : (
          <form action={handleStep2} className="space-y-4">
            <Button
              type="button"
              className="w-full bg-[#26A5E4] text-white hover:bg-[#26A5E4]/90"
              render={<a href={`https://t.me/${BOT_USERNAME}?start=register`} target="_blank" rel="noopener noreferrer" />}
            >
              <Send className="size-4" /> Telegram botga o&apos;tish
            </Button>
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-1.5">
                <KeyRound className="size-3.5" /> Tasdiqlash kodi
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Yakunlanmoqda..." : "Yakunlash"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Orqaga
            </button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Kirish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
