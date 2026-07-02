import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Bot, FileText, MessageSquare, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotCapacity, BotListItem } from "@/lib/db/bots";

type BotsApiResponse = {
  bots: BotListItem[];
  capacity: BotCapacity;
};

const recentActivity = [
  "Return policy bot answered 18 questions",
  "Getting-started.md finished processing",
  "Widget theme updated for Acme Support"
];

export default async function AppDashboardPage() {
  const result = await fetchInternalApi<BotsApiResponse>("/api/bots");

  if (!result.ok) {
    if (result.status === 401) {
      redirect("/login?next=/app");
    }

    throw new Error(result.error.message);
  }

  const { bots, capacity } = result.data;
  const firstBot = bots[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Support bots that know your docs</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Create a bot, upload product knowledge, test answers, and publish the widget to your site.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/bots/new">
            <Bot className="size-4" />
            New bot
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Bot} label="Bots" value={`${capacity.used} / ${capacity.bot_limit}`} helper={`${capacity.plan} plan limit`} />
        <StatCard icon={FileText} label="Knowledge docs" value="3 / 5" helper="2 ready, 1 processing" />
        <StatCard icon={MessageSquare} label="Monthly messages" value="42 / 100" helper="Resets Aug 1" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Launch checklist</CardTitle>
            <CardDescription>These are the surfaces later steps will connect to real data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Create bot profile", "Set tone, fallback copy, and widget availability."],
              ["Upload docs", "Add PDFs, markdown, or text files as searchable knowledge."],
              ["Test answers", "Ask real support questions before publishing."],
              ["Install widget", "Copy one script tag into a customer site."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-md border bg-card p-4">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>{firstBot ? "Recent workspace activity." : "Activity appears after you create a bot."}</CardDescription>
          </CardHeader>
          <CardContent>
            {firstBot ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity} className="flex items-start gap-3 rounded-md border bg-background p-3">
                    <PlugZap className="mt-0.5 size-4 text-primary" />
                    <p className="text-sm">{activity}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                Create a bot to start building your support assistant.
              </div>
            )}
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link href={firstBot ? `/app/bots/${firstBot.id}` : "/app/bots/new"}>
                {firstBot ? "Open bot" : "Create bot"}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
