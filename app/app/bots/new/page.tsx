import Link from "next/link";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import { ArrowLeft, ArrowRight, Bot, CreditCard, Palette } from "lucide-react";
import { createBot } from "@/app/app/bots/actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotCapacity, BotListItem } from "@/lib/db/bots";
import { planAllowsCustomTheme } from "@/lib/plans";
import { defaultWidgetSettings } from "@/lib/widget/settings";

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
  const canCustomizeWidgetTheme = planAllowsCustomTheme(capacity.plan);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
          <Link href="/app/bots">
            <ArrowLeft className="size-4" />
            Bots
          </Link>
        </Button>
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
        <form action={createBot} className="space-y-5">
          {error ? <div className="rounded-md border bg-card px-4 py-3 text-sm text-destructive">{error}</div> : null}
          <Card>
            <CardHeader>
              <CardTitle>Bot profile</CardTitle>
              <CardDescription>These settings shape the in-app chat behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
                  <span className="block font-medium">Mention source files</span>
                  <span className="block text-sm text-muted-foreground">
                    Let the bot reference source filenames in answers when helpful.
                  </span>
                </span>
                <input name="sourceReferencesEnabled" type="checkbox" className="size-5 accent-primary" defaultChecked />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Widget
              </CardTitle>
              <CardDescription>Set the public widget defaults for this bot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium">Public widget</span>
                  <span className="block text-sm text-muted-foreground">Allow this bot to be embedded after setup.</span>
                </span>
                <input name="publicWidgetEnabled" type="checkbox" className="size-5 accent-primary" defaultChecked />
              </label>

              <div className="grid gap-4 rounded-md border bg-muted/35 p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widgetBotDisplayName">Widget bot name</Label>
                  <Input
                    id="widgetBotDisplayName"
                    name="widgetBotDisplayName"
                    defaultValue={defaultWidgetSettings.botDisplayName}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetBotAvatarInitials">Avatar initials</Label>
                  <Input
                    id="widgetBotAvatarInitials"
                    name="widgetBotAvatarInitials"
                    defaultValue={defaultWidgetSettings.botAvatarInitials}
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetPrimaryColor">Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="widgetPrimaryColor"
                      name="widgetPrimaryColor"
                      type="color"
                      defaultValue={defaultWidgetSettings.primaryColor}
                      className="h-10 w-14 p-1"
                      aria-label="Widget primary color"
                      disabled={!canCustomizeWidgetTheme}
                    />
                    <Input
                      name={!canCustomizeWidgetTheme ? "widgetPrimaryColor" : undefined}
                      defaultValue={defaultWidgetSettings.primaryColor}
                      readOnly
                      aria-label="Selected widget primary color"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetLauncherPosition">Launcher position</Label>
                  <select
                    id="widgetLauncherPosition"
                    name="widgetLauncherPosition"
                    defaultValue={defaultWidgetSettings.launcherPosition}
                    disabled={!canCustomizeWidgetTheme}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                  </select>
                  {!canCustomizeWidgetTheme ? (
                    <input type="hidden" name="widgetLauncherPosition" value={defaultWidgetSettings.launcherPosition} />
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="widgetWelcomeMessage">Welcome message</Label>
                  <Textarea
                    id="widgetWelcomeMessage"
                    name="widgetWelcomeMessage"
                    defaultValue={defaultWidgetSettings.welcomeMessage}
                    maxLength={180}
                  />
                </div>
              </div>

              {!canCustomizeWidgetTheme ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Your {capacity.plan} plan uses the default widget color and launcher position. Upgrade to customize the theme.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <SubmitButton pendingLabel="Creating...">
            <Bot className="size-4" />
            Create bot
          </SubmitButton>
        </form>
      )}

      <ol className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        {["Create bot", "Upload sources", "Test and embed"].map((item, index, steps) => (
          <Fragment key={item}>
            <li className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span className="font-medium">{item}</span>
            </li>
            {index < steps.length - 1 ? (
              <li aria-hidden="true" className="hidden text-muted-foreground sm:block">
                <ArrowRight className="size-5" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
