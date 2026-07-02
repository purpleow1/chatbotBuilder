import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Copy, FileText, MessageSquare, Palette, Save, Settings, Trash2 } from "lucide-react";
import { deleteBot, updateBot } from "@/app/app/bots/actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotRecord } from "@/lib/db/bots";

type BotApiResponse = {
  bot: BotRecord;
};

function getNotice(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.created) {
    return "Bot created. Add knowledge sources in the next step.";
  }

  if (searchParams.saved) {
    return "Bot settings saved.";
  }

  if (typeof searchParams.error === "string") {
    return searchParams.error;
  }

  return null;
}

export default async function BotDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { botId } = await params;
  const [query, result] = await Promise.all([searchParams, fetchInternalApi<BotApiResponse>(`/api/bots/${botId}`)]);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=/app/bots/${botId}`);
    }

    if (result.status === 404) {
      notFound();
    }

    throw new Error(result.error.message);
  }

  const { bot } = result.data;
  const notice = getNotice(query);
  const embedSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/embed.js" data-bot-id="${bot.id}"></script>`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Bot settings</p>
          <h1 className="text-3xl font-semibold tracking-tight">{bot.name}</h1>
          <p className="mt-2 text-muted-foreground">Configure the bot profile, testing route, and widget availability.</p>
        </div>
        <Button asChild>
          <Link href={`/app/bots/${bot.id}/chat`}>
            <MessageSquare className="size-4" />
            Test chat
          </Link>
        </Button>
      </div>

      {notice ? <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">{notice}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Profile
            </CardTitle>
            <CardDescription>These settings feed prompts and widget presentation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateBot} className="space-y-4">
              <input type="hidden" name="botId" value={bot.id} />
              <div className="space-y-2">
                <Label htmlFor="name">Bot name</Label>
                <Input id="name" name="name" defaultValue={bot.name} required minLength={2} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description / purpose</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={bot.description ?? ""}
                  placeholder="Answer setup, billing, and product questions."
                  maxLength={320}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportTone">Support tone</Label>
                <Input
                  id="supportTone"
                  name="supportTone"
                  defaultValue={bot.support_tone ?? ""}
                  placeholder="Friendly and specific"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback message</Label>
                <Textarea
                  id="fallbackMessage"
                  name="fallbackMessage"
                  defaultValue={bot.fallback_message ?? ""}
                  placeholder="I do not know yet, but our team can help."
                  maxLength={240}
                />
              </div>
              <label className="flex flex-col gap-3 rounded-md border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium">Public widget</span>
                  <span className="block text-sm text-muted-foreground">Allow this bot to be embedded after setup.</span>
                </span>
                <input
                  name="publicWidgetEnabled"
                  type="checkbox"
                  className="size-5 accent-primary"
                  defaultChecked={bot.public_widget_enabled}
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SubmitButton pendingLabel="Saving...">
                  <Save className="size-4" />
                  Save changes
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Widget
            </CardTitle>
            <CardDescription>Install snippet preview. The real loader is connected in Step 9.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted p-3">
              <code className="break-all text-sm">{embedSnippet}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" type="button">
                <Copy className="size-4" />
                Copy snippet
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/widget/${bot.id}`}>Preview widget</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Knowledge sources
          </CardTitle>
          <CardDescription>Document upload and processing arrive in Steps 5 and 6.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/45 p-4 text-sm text-muted-foreground">
            No documents are connected yet. The next step adds upload, status, and delete behavior.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Deleting a bot also removes its future documents, conversations, and messages.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteBot}>
            <input type="hidden" name="botId" value={bot.id} />
            <SubmitButton variant="destructive" pendingLabel="Deleting...">
              <Trash2 className="size-4" />
              Delete bot
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

