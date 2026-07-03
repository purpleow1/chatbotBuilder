import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Bot, FileText, MessageSquare, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotCapacity, BotListItem } from "@/lib/db/bots";
import type { SourceDocumentRecord } from "@/lib/db/documents";
import type { SubscriptionRecord, WorkspaceUsage } from "@/lib/db/subscriptions";

type BotsApiResponse = {
  bots: BotListItem[];
  capacity: BotCapacity;
};

type BillingApiResponse = {
  subscription: SubscriptionRecord;
  usage: WorkspaceUsage;
};

type DocumentsApiResponse = {
  documents: SourceDocumentRecord[];
};

function formatResetDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatPlan(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function getKnowledgeHelper(documents: SourceDocumentRecord[] | null) {
  if (!documents) {
    return "Document status unavailable";
  }

  const ready = documents.filter((document) => document.status === "ready").length;
  const processing = documents.filter((document) => document.status === "queued" || document.status === "processing").length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const parts = [
    `${ready} ready`,
    processing > 0 ? `${processing} processing` : null,
    failed > 0 ? `${failed} failed` : null
  ].filter(Boolean);

  return parts.join(", ");
}

export default async function AppDashboardPage() {
  const [botsResult, billingResult] = await Promise.all([
    fetchInternalApi<BotsApiResponse>("/api/bots"),
    fetchInternalApi<BillingApiResponse>("/api/billing")
  ]);

  if (!botsResult.ok) {
    if (botsResult.status === 401) {
      redirect("/login?next=/app");
    }

    throw new Error(botsResult.error.message);
  }

  if (!billingResult.ok) {
    if (billingResult.status === 401) {
      redirect("/login?next=/app");
    }

    throw new Error(billingResult.error.message);
  }

  const { bots } = botsResult.data;
  const { subscription, usage } = billingResult.data;
  const documentResults = await Promise.all(
    bots.map((bot) => fetchInternalApi<DocumentsApiResponse>(`/api/bots/${bot.id}/documents`))
  );
  const documents = documentResults.every((documentResult) => documentResult.ok)
    ? documentResults.flatMap((documentResult) => (documentResult.ok ? documentResult.data.documents : []))
    : null;
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
        <StatCard icon={Bot} label="Bots" value={`${usage.botCount} / ${subscription.bot_limit}`} helper={`${formatPlan(subscription.plan)} plan limit`} />
        <StatCard
          icon={FileText}
          label="Knowledge docs"
          value={`${usage.documentCount} / ${subscription.document_limit}`}
          helper={getKnowledgeHelper(documents)}
        />
        <StatCard
          icon={MessageSquare}
          label="Monthly messages"
          value={`${usage.monthlyMessageCount} / ${subscription.monthly_message_limit}`}
          helper={`Resets ${formatResetDate(subscription.current_period_end)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Launch checklist</CardTitle>
            <CardDescription>These are the surfaces later steps will connect to real data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-5 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border">
              {[
                ["Create bot profile", "Set tone, fallback copy, and widget availability."],
                ["Upload docs", "Add PDFs, markdown, or text files as searchable knowledge."],
                ["Test answers", "Ask real support questions before publishing."],
                ["Install widget", "Copy one script tag into a customer site."]
              ].map(([title, description], index) => (
                <li key={title} className="relative flex gap-4">
                  <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Workspace activity tracking is coming soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-md border bg-background p-4">
              <PlugZap className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Activity feed coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We will show bot conversations, document processing, and widget updates here once the feature is ready.
                </p>
              </div>
            </div>
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
