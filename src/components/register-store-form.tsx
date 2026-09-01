"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Send, KeyRound } from "lucide-react";
import { checkPhoneAvailable, checkStoreNameAvailable, type NameAvailability } from "@/actions/auth";
import { completeStoreRegistration } from "@/actions/session";
import { verifyTelegramCode } from "@/actions/telegram-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { PasswordInput } from "@/components/password-input";
import { StepIndicator } from "@/components/step-indicator";
import { StoreTypeMultiSelect, type StoreTypeOption } from "@/components/store-type-multi-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

type Step1Data = { fullName: string; phone: string; password: string; storeName: string; storeTypeIds: string[] };
type NameStatus = { status: "idle" | "checking" } | NameAvailability;

export function RegisterStoreForm({ storeTypes }: { storeTypes: StoreTypeOption[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const [storeName, setStoreName] = useState("");
  const [nameStatus, setNameStatus] = useState<NameStatus>({ status: "idle" });

  useEffect(() => {
    const trimmed = storeName.trim();
    if (trimmed.length < 2) {
      // Resets a stale result from a previous longer name — genuinely
      // triggered by the name changing, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameStatus({ status: "idle" });
      return;
    }
    let cancelled = false;
    setNameStatus({ status: "checking" });
    const timeout = setTimeout(async () => {
      const result = await checkStoreNameAvailable(trimmed);
      if (!cancelled) setNameStatus(result);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [storeName]);

  const nameBorderClass =
    nameStatus.status === "available"
      ? "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
      : nameStatus.status === "taken"
        ? "border-amber-600 focus-visible:border-amber-600 focus-visible:ring-amber-600/20"
        : nameStatus.status === "invalid"
          ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
          : "";

  function handleStep1(formData: FormData) {
    setError(null);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const trimmedStoreName = storeName.trim();
    const storeTypeIds = formData.getAll("storeTypeIds") as string[];

    if (!phone || phone.length < 13) {
      setError("Telefon raqamni to'liq kiriting");
      return;
    }
    if (nameStatus.status === "taken") {
      setError("Bu do'kon nomi allaqachon band. Iltimos, boshqa nom tanlang");
      return;
    }
    if (nameStatus.status === "invalid") {
      setError(nameStatus.message);
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
      setStep1Data({ fullName, phone, password, storeName: trimmedStoreName, storeTypeIds });
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
    <Card className="w-full max-w-sm rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Do&apos;kon oching</CardTitle>
        <CardDescription>
          {step === 1
            ? "Ro'yxatdan o'tgach, do'koningiz Super Admin tomonidan tasdiqlangach faollashadi."
            : "Telegram bot orqali tasdiqlashni yakunlang."}
        </CardDescription>
        <StepIndicator step={step} labels={["Ma'lumotlar", "Tasdiqlash"]} />
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <form action={handleStep1} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Do&apos;kon nomi</Label>
              <Input
                id="storeName"
                name="storeName"
                placeholder="Masalan: Aziz Market"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={cn(nameBorderClass)}
              />
              {nameStatus.status === "available" && (
                <p className="text-xs text-emerald-600">Bu nomdan foydalanish mumkin</p>
              )}
              {nameStatus.status === "taken" && (
                <p className="text-xs text-amber-600">Bu nom allaqachon band. Iltimos, boshqa nom tanlang</p>
              )}
              {nameStatus.status === "invalid" && (
                <p className="text-xs text-destructive">{nameStatus.message}</p>
              )}
            </div>
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
            <div className="space-y-2">
              <Label>Do&apos;kon turi</Label>
              <StoreTypeMultiSelect storeTypes={storeTypes} />
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
