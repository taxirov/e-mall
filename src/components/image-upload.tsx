"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Uploads straight from the browser to Cloudinary (unsigned preset) — no server round-trip, no secret key in the app. */
export function ImageUpload({
  name = "imageUrl",
  defaultUrl,
  label = "Rasm (ixtiyoriy)",
}: {
  name?: string;
  defaultUrl?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError("Rasm yuklash sozlanmagan");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { secure_url: string };
      setUrl(data.secure_url);
    } catch {
      setError("Rasm yuklanmadi, qayta urinib ko'ring");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          <div
            className="relative shrink-0 overflow-hidden rounded-md border bg-muted"
            style={{ width: 64, height: 64 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="object-cover"
              style={{ width: "100%", height: "100%" }}
            />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div
            className="flex shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/40 text-muted-foreground"
            style={{ width: 64, height: 64 }}
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </div>
        )}
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={uploading} render={<span />} nativeButton={false}>
            {uploading ? "Yuklanmoqda..." : url ? "Almashtirish" : "Rasm tanlash"}
          </Button>
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
