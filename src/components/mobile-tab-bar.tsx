"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/cart", label: "Savat", icon: ShoppingBag },
  { href: "/orders", label: "Buyurtmalar", icon: Receipt },
  { href: "/account", label: "Profil", icon: User },
] as const;

/** Uzum-Tezkor-style bottom tab bar — mobile only, the header icons cover the same ground on wider screens. */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-around px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
