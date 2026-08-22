"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { checkPhoneAvailable } from "@/actions/auth";
import { cn } from "@/lib/utils";

/** Formats up to 9 raw digits as "90 444 99 00". */
function formatDigits(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return parts.filter(Boolean).join(" ");
}

/**
 * Phone input with a fixed "+998" prefix — the user only types the
 * remaining 9 digits, auto-formatted as "90 444 99 00". Submits the full
 * "+998XXXXXXXXX" string via a hidden input (matches phoneSchema exactly),
 * so no backend/validation changes are needed.
 */
export function PhoneInput({
  id = "phone",
  name = "phone",
  defaultValue,
  required = true,
  checkAvailability = false,
}: {
  id?: string;
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
  /** When true, live-checks the number against existing users as it's completed (for registration/invite flows — not login). */
  checkAvailability?: boolean;
}) {
  const initialDigits = defaultValue?.replace(/^\+998/, "").replace(/\D/g, "").slice(0, 9) ?? "";
  const [digits, setDigits] = useState(initialDigits);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!checkAvailability || digits.length !== 9) {
      // Resets a stale result from a previous complete number — genuinely
      // triggered by the digits changing, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    const timeout = setTimeout(async () => {
      const result = await checkPhoneAvailable(`+998${digits}`);
      if (!cancelled) setStatus(result.ok ? "available" : "taken");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [digits, checkAvailability]);

  const borderClass =
    status === "available"
      ? "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
      : status === "taken"
        ? "border-amber-600 focus-visible:border-amber-600 focus-visible:ring-amber-600/20"
        : "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-stretch">
        <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
          +998
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="90 444 99 00"
          className={cn("rounded-l-none", borderClass)}
          value={formatDigits(digits)}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
          required={required}
        />
        <input type="hidden" name={name} value={digits ? `+998${digits}` : ""} />
      </div>
      {status === "available" && (
        <p className="text-xs text-emerald-600">Bu raqamdan foydalanish mumkin</p>
      )}
      {status === "taken" && (
        <p className="text-xs text-amber-600">Bu raqam bilan foydalanuvchi allaqachon ro&apos;yxatdan o&apos;tgan</p>
      )}
    </div>
  );
}
