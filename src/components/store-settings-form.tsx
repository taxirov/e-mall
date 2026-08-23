"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStoreSettings } from "@/actions/store";
import { slugify } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-mall.uz";

export function StoreSettingsForm({
  initialName,
  initialDescription,
  initialSlug,
  initialLogoUrl,
  initialBannerUrl,
  initialAddress,
  initialLocationUrl,
  initialWorkingHours,
  initialContactPhone,
  initialInstagramUrl,
  initialTelegramUrl,
}: {
  initialName: string;
  initialDescription: string;
  initialSlug: string;
  initialLogoUrl: string | null;
  initialBannerUrl: string | null;
  initialAddress: string;
  initialLocationUrl: string;
  initialWorkingHours: string;
  initialContactPhone: string | null;
  initialInstagramUrl: string;
  initialTelegramUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initialSlug);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStoreSettings({
        name: formData.get("name"),
        description: formData.get("description"),
        slug,
        logoUrl: formData.get("logoUrl"),
        bannerUrl: formData.get("bannerUrl"),
        address: formData.get("address"),
        locationUrl: formData.get("locationUrl"),
        workingHours: formData.get("workingHours"),
        contactPhone: formData.get("contactPhone"),
        instagramUrl: formData.get("instagramUrl"),
        telegramUrl: formData.get("telegramUrl"),
      });
      if (result.ok) {
        toast.success("Do'kon sozlamalari saqlandi");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Do&apos;kon sozlamalari</h1>
      <form action={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Umumiy ma&apos;lumot</CardTitle>
            <CardDescription>Do&apos;koningiz nomi, tavsifi va subdomeni</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Do&apos;kon nomi</Label>
              <Input id="name" name="name" defaultValue={initialName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
              <Textarea id="description" name="description" defaultValue={initialDescription} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Subdomen</Label>
              <div className="flex items-center gap-1">
                <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
                <span className="shrink-0 text-sm text-muted-foreground">.{ROOT_DOMAIN}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Do&apos;kon vitrinangiz manzili:{" "}
                <span className="font-medium text-foreground">
                  {slug || "..."}.{ROOT_DOMAIN}
                </span>
                . O&apos;zgartirsangiz, eski manzil ishlamay qoladi.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vitrina va aloqa</CardTitle>
            <CardDescription>Bu ma&apos;lumotlar do&apos;koningiz sahifasida mijozlarga ko&apos;rinadi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload name="logoUrl" defaultUrl={initialLogoUrl} label="Avatar (logotip)" />
            <ImageUpload name="bannerUrl" defaultUrl={initialBannerUrl} label="Banner rasm" />
            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Textarea id="address" name="address" defaultValue={initialAddress} placeholder="Shahar, ko'cha, uy raqami" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationUrl">Lokatsiya havolasi (Google/Yandex Maps)</Label>
              <Input id="locationUrl" name="locationUrl" type="url" defaultValue={initialLocationUrl} placeholder="https://maps.app.goo.gl/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">Ish vaqti</Label>
              <Input id="workingHours" name="workingHours" defaultValue={initialWorkingHours} placeholder="Dush-Shan: 09:00 - 21:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Aloqa uchun telefon raqami (ixtiyoriy)</Label>
              <PhoneInput id="contactPhone" name="contactPhone" defaultValue={initialContactPhone} required={false} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram havolasi</Label>
              <Input id="instagramUrl" name="instagramUrl" type="url" defaultValue={initialInstagramUrl} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegramUrl">Telegram havolasi</Label>
              <Input id="telegramUrl" name="telegramUrl" type="url" defaultValue={initialTelegramUrl} placeholder="https://t.me/..." />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={pending}>
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>
    </div>
  );
}
