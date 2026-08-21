"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, LayoutDashboard, Package, Users, ClipboardList, ShoppingCart, Store, Settings, LogOut, Warehouse, Tags, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { signOutAction } from "@/actions/session";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/dashboard/admin", label: "Do'konlar", icon: LayoutDashboard },
    { href: "/dashboard/admin/categories", label: "Kategoriyalar", icon: Tags },
    { href: "/dashboard/admin/products", label: "Mahsulotlar", icon: Package },
    { href: "/dashboard/admin/requests", label: "So'rovlar", icon: Send },
  ],
  OWNER: [
    { href: "/dashboard/owner", label: "Umumiy ko'rinish", icon: LayoutDashboard },
    { href: "/dashboard/owner/products", label: "Mahsulotlar", icon: Package },
    { href: "/dashboard/owner/warehouse", label: "Ombor", icon: Warehouse },
    { href: "/dashboard/owner/sellers", label: "Sotuvchilar", icon: Users },
    { href: "/dashboard/owner/orders", label: "Buyurtmalar", icon: ClipboardList },
    { href: "/dashboard/owner/requests", label: "Mening so'rovlarim", icon: Send },
    { href: "/dashboard/pos", label: "POS", icon: ShoppingCart },
    { href: "/dashboard/owner/settings", label: "Sozlamalar", icon: Settings },
  ],
  SELLER: [{ href: "/dashboard/pos", label: "POS", icon: ShoppingCart }],
};

export function DashboardShell({
  role,
  storeName,
  userName,
  children,
}: {
  role: string;
  storeName?: string | null;
  userName: string;
  children: React.ReactNode;
}) {
  const items = NAV_ITEMS[role] ?? [];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/20 p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Store className="size-5" />
            e-mall.uz
          </div>
          <DashboardNotifications role={role} />
        </div>
        {storeName && <p className="mb-4 truncate text-xs text-muted-foreground">{storeName}</p>}
        {nav}
        <form action={signOutAction} className="mt-auto pt-4">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" />
            Chiqish
          </Button>
        </form>
      </aside>

      <header className="flex items-center justify-between border-b p-3 md:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <Store className="size-5" />
          e-mall.uz
        </div>
        <div className="flex items-center gap-2">
          <DashboardNotifications role={role} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetTitle className="mb-4">{storeName ?? userName}</SheetTitle>
              {nav}
              <form action={signOutAction} className="mt-4">
                <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                  <LogOut className="size-4" />
                  Chiqish
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
