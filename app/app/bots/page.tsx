import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, CreditCard, MessageSquare, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotCapacity, BotListItem } from "@/lib/db/bots";

type BotsApiResponse = {
  bots: BotListItem[];
  capacity: BotCapacity;
};

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function noticeMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.deleted) {
    return "Bot deleted.";
  }

  if (typeof searchParams.error === "string") {
    return searchParams.error;
  }

  return null;
}

export default async function BotsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, result] = await Promise.all([searchParams, fetchInternalApi<BotsApiResponse>("/api/bots")]);

  if (!result.ok) {
    if (result.status === 401) {
      redirect("/login?next=/app/bots");
    }

    throw new Error(result.error.message);
  }

  const { bots, capacity } = result.data;
  const notice = noticeMessage(params);
  const usagePercent = capacity.bot_limit > 0 ? Math.min((capacity.used / capacity.bot_limit) * 100, 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Bots</p>
          <h1 className="text-3xl font-semibold tracking-tight">Chatbot projects</h1>
          <p className="mt-2 text-muted-foreground">Create, test, and configure the assistants your customers can use.</p>
        </div>
        {capacity.can_create ? (
          <Button asChild>
            <Link href="/app/bots/new">
              <Plus className="size-4" />
              New bot
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/app/billing">
              <CreditCard className="size-4" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>

      {notice ? <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">{notice}</div> : null}

      {bots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Create your first support bot</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with a bot profile, then add knowledge sources and test answers in the next setup steps.
                </p>
              </div>
            </div>
            <Button asChild disabled={!capacity.can_create}>
              <Link href={capacity.can_create ? "/app/bots/new" : "/app/billing"}>
                {capacity.can_create ? <Plus className="size-4" /> : <CreditCard className="size-4" />}
                {capacity.can_create ? "New bot" : "Upgrade"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="relative transition-colors hover:border-primary/50 hover:bg-muted/25">
              <Link
                href={`/app/bots/${bot.id}`}
                aria-label={`Open ${bot.name}`}
                className="absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <CardContent className="pointer-events-none relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{bot.name}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {formatStatus(bot.status)}
                      </span>
                      {bot.public_widget_enabled ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">Widget on</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bot.description ?? "No purpose added yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{bot.document_count} knowledge docs</span>
                      <span>{bot.monthly_messages} messages this month</span>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-auto flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/app/bots/${bot.id}/chat`}>
                      <MessageSquare className="size-4" />
                      Test chat
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Open settings for ${bot.name}`} asChild>
                    <Link href={`/app/bots/${bot.id}`}>
                      <Settings className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{capacity.plan.charAt(0).toUpperCase() + capacity.plan.slice(1)} plan capacity</CardTitle>
          <CardDescription>Bot creation is enforced in both this page and the API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {capacity.used} of {capacity.bot_limit} bots used.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
