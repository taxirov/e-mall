"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

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
}: {
  id?: string;
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  const initialDigits = defaultValue?.replace(/^\+998/, "").replace(/\D/g, "").slice(0, 9) ?? "";
  const [digits, setDigits] = useState(initialDigits);

  return (
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
        className="rounded-l-none"
        value={formatDigits(digits)}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
        required={required}
      />
      <input type="hidden" name={name} value={digits ? `+998${digits}` : ""} />
    </div>
  );
}
