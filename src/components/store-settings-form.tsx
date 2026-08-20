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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-mall.uz";

export function StoreSettingsForm({
  initialName,
  initialDescription,
  initialSlug,
}: {
  initialName: string;
  initialDescription: string;
  initialSlug: string;
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umumiy ma&apos;lumot</CardTitle>
          <CardDescription>Do&apos;koningiz nomi, tavsifi va subdomeni</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
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
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                />
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
            <Button type="submit" disabled={pending}>
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
