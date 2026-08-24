"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Store as StoreIcon, MapPin, Palette } from "lucide-react";
import { updateUserProfile, changePassword } from "@/actions/user-profile";
import { updateStoreIdentity, updateStoreContact } from "@/actions/store";
import { slugify } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScriptToggle } from "@/components/script-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-mall.uz";

function ProfileTab({ fullName, phone }: { fullName: string; phone: string }) {
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

function StoreIdentityTab({
  name,
  description,
  slug: initialSlug,
  logoUrl,
  bannerUrl,
}: {
  name: string;
  description: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initialSlug);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStoreIdentity({
        name: formData.get("name"),
        description: formData.get("description"),
        slug,
        logoUrl: formData.get("logoUrl"),
        bannerUrl: formData.get("bannerUrl"),
      });
      if (result.ok) {
        toast.success("Do'kon ma'lumotlari saqlandi");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Do&apos;kon ma&apos;lumotlari</CardTitle>
        <CardDescription>Do&apos;koningiz nomi, tavsifi, subdomeni va rasmlari</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Do&apos;kon nomi</Label>
            <Input id="name" name="name" defaultValue={name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
            <Textarea id="description" name="description" defaultValue={description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Subdomen</Label>
            <div className="flex items-center gap-1">
              <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
              <span data-no-transliterate className="shrink-0 text-sm text-muted-foreground">
                .{ROOT_DOMAIN}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Do&apos;kon vitrinangiz manzili:{" "}
              <span data-no-transliterate className="font-medium text-foreground">
                {slug || "..."}.{ROOT_DOMAIN}
              </span>
              . O&apos;zgartirsangiz, eski manzil ishlamay qoladi.
            </p>
          </div>
          <div className="space-y-1.5">
            <ImageUpload name="logoUrl" defaultUrl={logoUrl} label="Avatar (logotip)" />
            <p className="text-xs text-muted-foreground">Tavsiya etilgan o&apos;lcham: 400×400px (kvadrat rasm), hajmi 5 MB gacha.</p>
          </div>
          <div className="space-y-1.5">
            <ImageUpload name="bannerUrl" defaultUrl={bannerUrl} label="Banner rasm" />
            <p className="text-xs text-muted-foreground">
              Tavsiya etilgan o&apos;lcham: 1600×400px (kenglik balandlikdan 4 baravar katta), hajmi 5 MB gacha. Rasm
              sahifa kengligiga moslab kesiladi, shuning uchun asosiy qism (matn, logotip) markazda joylashgani
              ma&apos;qul.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StoreContactTab({
  address,
  locationUrl,
  workingHours,
  contactPhone,
  instagramUrl,
  telegramUrl,
}: {
  address: string;
  locationUrl: string;
  workingHours: string;
  contactPhone: string | null;
  instagramUrl: string;
  telegramUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStoreContact({
        address: formData.get("address"),
        locationUrl: formData.get("locationUrl"),
        workingHours: formData.get("workingHours"),
        contactPhone: formData.get("contactPhone"),
        instagramUrl: formData.get("instagramUrl"),
        telegramUrl: formData.get("telegramUrl"),
      });
      if (result.ok) {
        toast.success("Bog'lanish ma'lumotlari saqlandi");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bog&apos;lanish</CardTitle>
        <CardDescription>Bu ma&apos;lumotlar do&apos;koningiz sahifasida mijozlarga ko&apos;rinadi</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Manzil</Label>
            <Textarea id="address" name="address" defaultValue={address} placeholder="Shahar, ko'cha, uy raqami" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationUrl">Lokatsiya havolasi (Google/Yandex Maps)</Label>
            <Input id="locationUrl" name="locationUrl" type="url" defaultValue={locationUrl} placeholder="https://maps.app.goo.gl/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workingHours">Ish vaqti</Label>
            <Input id="workingHours" name="workingHours" defaultValue={workingHours} placeholder="Dush-Shan: 09:00 - 21:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Aloqa uchun telefon raqami (ixtiyoriy)</Label>
            <PhoneInput id="contactPhone" name="contactPhone" defaultValue={contactPhone} required={false} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram havolasi</Label>
            <Input id="instagramUrl" name="instagramUrl" type="url" defaultValue={instagramUrl} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegramUrl">Telegram havolasi</Label>
            <Input id="telegramUrl" name="telegramUrl" type="url" defaultValue={telegramUrl} placeholder="https://t.me/..." />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SiteSettingsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Til</CardTitle>
          <CardDescription>Butun sayt matnini O&apos;zbek lotin yoki krill alifbosida ko&apos;ring</CardDescription>
        </CardHeader>
        <CardContent>
          <ScriptToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mavzu</CardTitle>
          <CardDescription>
            Kunduzgi, qorong&apos;u yoki belgilangan vaqt bo&apos;yicha avtomatik almashadigan mavzuni tanlang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}

export function OwnerSettings({
  userFullName,
  userPhone,
  storeName,
  storeDescription,
  storeSlug,
  storeLogoUrl,
  storeBannerUrl,
  storeAddress,
  storeLocationUrl,
  storeWorkingHours,
  storeContactPhone,
  storeInstagramUrl,
  storeTelegramUrl,
}: {
  userFullName: string;
  userPhone: string;
  storeName: string;
  storeDescription: string;
  storeSlug: string;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
  storeAddress: string;
  storeLocationUrl: string;
  storeWorkingHours: string;
  storeContactPhone: string | null;
  storeInstagramUrl: string;
  storeTelegramUrl: string;
}) {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Sozlamalar</h1>
      <Tabs defaultValue="profile">
        <div className="overflow-x-auto">
          <TabsList variant="line">
            <TabsTrigger value="profile" className="gap-1.5">
              <User />
              Foydalanuvchi
            </TabsTrigger>
            <TabsTrigger value="store" className="gap-1.5">
              <StoreIcon />
              Do&apos;kon
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5">
              <MapPin />
              Bog&apos;lanish
            </TabsTrigger>
            <TabsTrigger value="site" className="gap-1.5">
              <Palette />
              Sayt
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="profile" keepMounted>
          <ProfileTab fullName={userFullName} phone={userPhone} />
        </TabsContent>
        <TabsContent value="store" keepMounted>
          <StoreIdentityTab name={storeName} description={storeDescription} slug={storeSlug} logoUrl={storeLogoUrl} bannerUrl={storeBannerUrl} />
        </TabsContent>
        <TabsContent value="contact" keepMounted>
          <StoreContactTab
            address={storeAddress}
            locationUrl={storeLocationUrl}
            workingHours={storeWorkingHours}
            contactPhone={storeContactPhone}
            instagramUrl={storeInstagramUrl}
            telegramUrl={storeTelegramUrl}
          />
        </TabsContent>
        <TabsContent value="site" keepMounted>
          <SiteSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
