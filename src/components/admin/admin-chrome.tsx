"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  BadgePercent,
  Ticket,
  Image,
  Truck,
  Star,
  Mail,
  Settings,
  Store,
  LogOut,
  Menu,
} from "lucide-react";

const NAV = [
  { section: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/banners", label: "Banners", icon: Image },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/delivery", label: "Delivery zones", icon: Truck },
    ],
  },
  {
    section: "Audience",
    items: [
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {group.section}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gold-500/15 text-gold-300"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}

export function AdminChrome({
  user,
  children,
}: {
  user: { name: string | null; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div dir="ltr" lang="en" className="min-h-dvh bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-navy-950 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-navy-950">
            A
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">ARAS</p>
            <p className="text-[11px] text-slate-400">Admin</p>
          </div>
        </div>
        <NavList pathname={pathname} />
        <div className="border-t border-white/10 px-3 py-4">
          <p className="truncate px-3 pb-2 text-xs text-slate-400">{user.email}</p>
          <SignOut />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <span className="text-sm font-bold text-navy-950">ARAS Admin</span>
        </div>
        <SheetContent side="left" className="w-72 border-none bg-navy-950 p-0 text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-navy-950">
              A
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">ARAS</p>
              <p className="text-[11px] text-slate-400">Admin</p>
            </div>
          </div>
          <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="border-t border-white/10 px-3 py-4">
            <SignOut />
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:ps-64">
        <header className="hidden h-16 items-center justify-between border-b bg-white px-6 md:flex">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Store className="size-4" />
            View storefront
          </a>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex size-8 items-center justify-center rounded-full bg-navy-950 font-semibold text-gold-400">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </span>
            <span className="font-medium">{user.name ?? user.email}</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
