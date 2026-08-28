"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfile, changePassword } from "@/actions/user-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ProfileTab({ fullName, phone }: { fullName: string; phone: string }) {
  const [pending, startTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateUserProfile({ fullName: formData.get("fullName") });
      if (result.ok) toast.success("Ma'lumotlar saqlandi");
      else toast.error(result.error);
    });
  }

  function handlePasswordSubmit(formData: FormData) {
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos kelmadi");
      return;
    }
    startPasswordTransition(async () => {
      const result = await changePassword({
        currentPassword: formData.get("currentPassword"),
        newPassword,
      });
      if (result.ok) {
        toast.success("Parol almashtirildi");
        (document.getElementById("password-form") as HTMLFormElement | null)?.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shaxsiy ma&apos;lumotlar</CardTitle>
          <CardDescription>Ismingiz va telefon raqamingiz</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">To&apos;liq ism</Label>
              <Input id="fullName" name="fullName" defaultValue={fullName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-display">Telefon raqam</Label>
              <Input id="phone-display" value={phone} disabled />
              <p className="text-xs text-muted-foreground">Telefon raqamni o&apos;zgartirib bo&apos;lmaydi.</p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parolni almashtirish</CardTitle>
          <CardDescription>Xavfsizlik uchun vaqti-vaqti bilan parolingizni yangilab turing</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" action={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Joriy parol</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yangi parol</Label>
              <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yangi parolni takrorlang</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required />
            </div>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Almashtirilmoqda..." : "Parolni almashtirish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
