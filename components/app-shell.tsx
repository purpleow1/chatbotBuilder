import Link from "next/link";
import type { Route } from "next";
import { BarChart3, Bot, BotMessageSquare, CreditCard, Home, LifeBuoy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app" as Route, label: "Dashboard", icon: Home },
  { href: "/app/bots" as Route, label: "Bots", icon: Bot },
  { href: "/app/billing" as Route, label: "Billing", icon: CreditCard }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BotMessageSquare className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">HelpDock AI</p>
            <p className="text-xs text-muted-foreground">Chatbot builder</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                item.href === "/app" && "text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="size-4 text-primary" />
              Free plan
            </div>
            <p className="mt-1 text-xs text-muted-foreground">1 bot, 5 docs, 100 messages.</p>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href="/app/billing">Upgrade</Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Link href="/app" className="flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BotMessageSquare className="size-5" />
            </span>
            <span className="font-semibold">HelpDock AI</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/bots/demo-support/chat">
                <LifeBuoy className="size-4" />
                Test bot
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/bots/demo-support">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">Demo workspace</p>
              <p className="text-xs text-muted-foreground">Auth arrives in Step 3</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              DW
            </span>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
