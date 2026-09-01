import Link from "next/link";
import Image from "next/image";

/** Shared visual frame for /login, /register, /register-customer — brand mark + a soft gradient backdrop above the actual form card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--brand-muted),transparent)]"
      />
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <Link href="/" data-no-transliterate className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Image src="/logo-96.png" alt="" width={32} height={32} className="rounded-lg" priority />
        e-mall.uz
      </Link>
      {children}
    </div>
  );
}
