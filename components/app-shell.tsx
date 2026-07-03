import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  Bot,
  BotMessageSquare,
  Building2,
  CreditCard,
  Home,
  LogOut
} from "lucide-react";
import { logout } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan, WorkspaceRole } from "@/lib/db/database.types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app" as Route, label: "Dashboard", icon: Home },
  { href: "/app/bots" as Route, label: "Bots", icon: Bot },
  { href: "/app/billing" as Route, label: "Billing", icon: CreditCard }
];

export type AppShellAccount = {
  user: {
    email: string;
    initials: string;
  };
  workspaces: {
    id: string;
    name: string;
    role: WorkspaceRole;
  }[];
  activeWorkspace: {
    id: string;
    name: string;
    role: WorkspaceRole;
  };
  subscription: {
    plan: SubscriptionPlan;
    bot_limit: number;
    document_limit: number;
    monthly_message_limit: number;
  };
};

function formatPlan(plan: SubscriptionPlan) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function AppShell({ children, account }: { children: React.ReactNode; account: AppShellAccount }) {
  const planName = formatPlan(account.subscription.plan);
  const planSummary = [
    pluralize(account.subscription.bot_limit, "bot"),
    pluralize(account.subscription.document_limit, "doc"),
    `${account.subscription.monthly_message_limit.toLocaleString()} messages`
  ].join(", ");

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
              {planName} plan
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{planSummary}.</p>
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
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <label className="hidden min-w-0 items-center gap-2 rounded-md border bg-card px-3 py-2 sm:flex">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <select
                aria-label="Workspace"
                defaultValue={account.activeWorkspace.id}
                className="max-w-48 bg-transparent text-sm font-medium outline-none"
              >
                {account.workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden max-w-48 text-right text-sm sm:block">
              <p className="truncate font-medium">{account.user.email}</p>
              <p className="text-xs capitalize text-muted-foreground">{account.activeWorkspace.role}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {account.user.initials}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
