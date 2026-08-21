"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { checkPhoneAvailable } from "@/actions/auth";
import { completeStoreRegistration } from "@/actions/session";
import { verifyTelegramCode } from "@/actions/telegram-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

type StoreType = { id: string; name: string };
type Step1Data = { fullName: string; phone: string; password: string; storeName: string; storeTypeIds: string[] };

export function RegisterStoreForm({ storeTypes }: { storeTypes: StoreType[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  function handleStep1(formData: FormData) {
    setError(null);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const storeName = formData.get("storeName") as string;
    const storeTypeIds = formData.getAll("storeTypeIds") as string[];

    if (!phone || phone.length < 13) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }
    if (storeTypeIds.length === 0) {
      setError("Kamida bitta do'kon turini tanlang");
      return;
    }

    startTransition(async () => {
      const result = await checkPhoneAvailable(phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep1Data({ fullName, phone, password, storeName, storeTypeIds });
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
      const resultError = await completeStoreRegistration({
        ...step1Data,
        telegramChatId: verifyResult.data.telegramChatId,
        telegramPhone: verifyResult.data.telegramPhone,
      });
      if (resultError) setError(resultError);
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Do&apos;kon oching</CardTitle>
        <CardDescription>
          {step === 1
            ? "Ro'yxatdan o'tgach, do'koningiz Super Admin tomonidan tasdiqlangach faollashadi."
            : "Telegram bot orqali tasdiqlashni yakunlang."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <form action={handleStep1} className="space-y-4">
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
              <PhoneInput />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label>Do&apos;kon turi</Label>
              <div className="space-y-2 rounded-md border p-3">
                {storeTypes.length === 0 && (
                  <p className="text-xs text-muted-foreground">Hozircha do&apos;kon turlari yo&apos;q</p>
                )}
                {storeTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox name="storeTypeIds" value={t.id} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Tekshirilmoqda..." : "Davom etish"}
            </Button>
          </form>
        ) : (
          <form action={handleStep2} className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              render={<a href={`https://t.me/${BOT_USERNAME}?start=register`} target="_blank" rel="noopener noreferrer" />}
            >
              <Send className="size-4" /> Telegram botga o&apos;tish
            </Button>
            <div className="space-y-2">
              <Label htmlFor="code">Tasdiqlash kodi</Label>
              <Input id="code" name="code" inputMode="numeric" maxLength={6} placeholder="123456" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
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
