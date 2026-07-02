import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, CheckCircle2, CreditCard } from "lucide-react";
import { createBot } from "@/app/app/bots/actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotCapacity, BotListItem } from "@/lib/db/bots";

type BotsApiResponse = {
  bots: BotListItem[];
  capacity: BotCapacity;
};

export default async function NewBotPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, result] = await Promise.all([searchParams, fetchInternalApi<BotsApiResponse>("/api/bots")]);

  if (!result.ok) {
    if (result.status === 401) {
      redirect("/login?next=/app/bots/new");
    }

    throw new Error(result.error.message);
  }

  const { capacity } = result.data;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">New bot</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create a support assistant</h1>
        <p className="mt-2 text-muted-foreground">
          Define the bot personality your team will train, test, and eventually embed.
        </p>
      </div>

      {!capacity.can_create ? (
        <Card>
          <CardHeader>
            <CardTitle>Plan limit reached</CardTitle>
            <CardDescription>
              Your {capacity.plan} plan includes {capacity.bot_limit} bot{capacity.bot_limit === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/app/billing">
                <CreditCard className="size-4" />
                View billing
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/bots">Back to bots</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bot profile</CardTitle>
            <CardDescription>These settings shape the in-app chat and public widget behavior.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? <div className="mb-5 rounded-md border bg-card px-4 py-3 text-sm text-destructive">{error}</div> : null}
            <form action={createBot} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Bot name</Label>
                <Input id="name" name="name" placeholder="Acme Support" required minLength={2} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description / purpose</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Answer setup, billing, and product questions for Acme customers."
                  maxLength={320}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportTone">Support tone</Label>
                <Input id="supportTone" name="supportTone" placeholder="Clear, concise, friendly" maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback message</Label>
                <Textarea
                  id="fallbackMessage"
                  name="fallbackMessage"
                  placeholder="I do not know yet, but our team can help."
                  maxLength={240}
                />
              </div>
              <label className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium">Public widget</span>
                  <span className="block text-sm text-muted-foreground">Allow this bot to be embedded after setup.</span>
                </span>
                <input name="publicWidgetEnabled" type="checkbox" className="size-5 accent-primary" defaultChecked />
              </label>
              <SubmitButton pendingLabel="Creating...">
                <Bot className="size-4" />
                Create bot
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {["Create profile", "Upload sources", "Test and embed"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-md border bg-card p-3 text-sm">
            <CheckCircle2 className="size-4 text-primary" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

