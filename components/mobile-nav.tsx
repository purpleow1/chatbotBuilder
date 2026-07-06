"use client";

import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { BarChart3, Bot, CreditCard, Home, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app" as Route, label: "Dashboard", icon: Home },
  { href: "/app/bots" as Route, label: "Bots", icon: Bot },
  { href: "/app/billing" as Route, label: "Billing", icon: CreditCard }
];

const LOGO_SRC = "/logos/askdoc-logo.svg";
const PRODUCT_NAME = "AskDoc";

type MobileNavProps = {
  planName: string;
  planSummary: string;
};

function isActivePath(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ planName, planSummary }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/25"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-r shadow-xl"
            style={{ backgroundColor: "hsl(var(--card))" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4">
              <Link href="/app" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <Image src={LOGO_SRC} alt={`${PRODUCT_NAME} logo`} width={120} height={34} priority className="h-9 w-auto" />
              </Link>
              <Button type="button" variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 bg-card p-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    isActivePath(pathname, item.href) && "bg-muted text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 border-t bg-card p-4">
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="size-4 text-primary" />
                  {planName} plan
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{planSummary}.</p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/app/billing" onClick={() => setOpen(false)}>
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
