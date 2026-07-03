import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, FileText, MessageSquare, Palette, Save, Settings, Trash2, Upload } from "lucide-react";
import { deleteBot, deleteDocument, retryDocumentIngestion, updateBot } from "@/app/app/bots/actions";
import { CopyWidgetScriptButton } from "@/app/app/bots/[botId]/copy-widget-script-button";
import { DocumentUploadForm } from "@/app/app/bots/[botId]/document-upload-form";
import { ConfirmedSubmitButton } from "@/components/confirmed-submit-button";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize, MAX_SOURCE_DOCUMENT_BYTES, SUPPORTED_SOURCE_EXTENSIONS } from "@/lib/api/document-validation";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotRecord } from "@/lib/db/bots";
import type { AccountSubscription } from "@/lib/db/onboarding";
import type { DocumentCapacity, SourceDocumentRecord } from "@/lib/db/documents";
import { applyWidgetPlanLimits, normalizeWidgetSettings } from "@/lib/widget/settings";
import { planAllowsCustomTheme } from "@/lib/plans";

type BotApiResponse = {
  bot: BotRecord;
  subscription: AccountSubscription;
};

type DocumentsApiResponse = {
  documents: SourceDocumentRecord[];
  capacity: DocumentCapacity;
};

function getNotice(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.created) {
    return "Bot created. Add knowledge sources in the next step.";
  }

  if (searchParams.saved) {
    return "Bot settings saved.";
  }

  if (searchParams.documentIngested) {
    return "Document ingested and ready for retrieval.";
  }

  if (searchParams.documentUploaded) {
    return "Document uploaded. Ingestion needs attention before retrieval.";
  }

  if (searchParams.documentDeleted) {
    return "Document deleted.";
  }

  if (typeof searchParams.error === "string") {
    return searchParams.error;
  }

  return null;
}

function getStatusClassName(status: SourceDocumentRecord["status"]) {
  switch (status) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("en", { maximumFractionDigits: 1 })} KB`;
  }

  return `${(bytes / (1024 * 1024)).toLocaleString("en", { maximumFractionDigits: 1 })} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function BotDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ botId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { botId } = await params;
  const [query, result, documentsResult] = await Promise.all([
    searchParams,
    fetchInternalApi<BotApiResponse>(`/api/bots/${botId}`),
    fetchInternalApi<DocumentsApiResponse>(`/api/bots/${botId}/documents`)
  ]);

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
  const documents = documentsResult.ok ? documentsResult.data.documents : [];
  const documentCapacity = documentsResult.ok ? documentsResult.data.capacity : null;
  const documentsError = documentsResult.ok ? null : documentsResult.error.message;
  const notice = getNotice(query);
  const canCustomizeWidgetTheme = planAllowsCustomTheme(result.data.subscription.plan);
  const widgetSettings = applyWidgetPlanLimits(normalizeWidgetSettings(bot.widget_settings, bot.name), result.data.subscription.plan);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const embedSnippet = `<script src="${appUrl}/embed.js" data-bot-id="${bot.id}"></script>`;
  const acceptedExtensions = SUPPORTED_SOURCE_EXTENSIONS.join(",");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link href="/app/bots">
              <ArrowLeft className="size-4" />
              Bots
            </Link>
          </Button>
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

      <form action={updateBot} className="space-y-4">
        <input type="hidden" name="botId" value={bot.id} />
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Profile
              </CardTitle>
              <CardDescription>These settings feed prompts and test chat behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Widget
              </CardTitle>
              <CardDescription>Publish, style, preview, and embed this bot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid gap-4 rounded-md border bg-muted/35 p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widgetBotDisplayName">Widget bot name</Label>
                  <Input
                    id="widgetBotDisplayName"
                    name="widgetBotDisplayName"
                    defaultValue={widgetSettings.botDisplayName}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widgetBotAvatarInitials">Avatar initials</Label>
                  <Input
                    id="widgetBotAvatarInitials"
                    name="widgetBotAvatarInitials"
                    defaultValue={widgetSettings.botAvatarInitials}
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
                      defaultValue={widgetSettings.primaryColor}
                      className="h-10 w-14 p-1"
                      aria-label="Widget primary color"
                      disabled={!canCustomizeWidgetTheme}
                    />
                    <Input
                      name={!canCustomizeWidgetTheme ? "widgetPrimaryColor" : undefined}
                      defaultValue={widgetSettings.primaryColor}
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
                    defaultValue={widgetSettings.launcherPosition}
                    disabled={!canCustomizeWidgetTheme}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                  </select>
                  {!canCustomizeWidgetTheme ? (
                    <input type="hidden" name="widgetLauncherPosition" value={widgetSettings.launcherPosition} />
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="widgetWelcomeMessage">Welcome message</Label>
                  <Textarea
                    id="widgetWelcomeMessage"
                    name="widgetWelcomeMessage"
                    defaultValue={widgetSettings.welcomeMessage}
                    maxLength={180}
                  />
                </div>
              </div>

              {!canCustomizeWidgetTheme ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Your {result.data.subscription.plan} plan uses the default widget color and launcher position. Upgrade to customize the theme.
                </div>
              ) : null}

              <div className="rounded-md border bg-muted p-3">
                <code className="break-all text-sm">{embedSnippet}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyWidgetScriptButton script={embedSnippet} />
                <Button variant="outline" asChild>
                  <Link href={`/widget/${bot.id}`}>Preview widget</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <SubmitButton pendingLabel="Saving...">
          <Save className="size-4" />
          Save changes
        </SubmitButton>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Knowledge sources
          </CardTitle>
          <CardDescription>
            Upload {SUPPORTED_SOURCE_EXTENSIONS.join(", ")} files up to {formatFileSize(MAX_SOURCE_DOCUMENT_BYTES)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {documentsError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Knowledge sources could not be loaded: {documentsError}
            </div>
          ) : null}

          {documentCapacity && !documentCapacity.can_upload ? (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Document limit reached</p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                  Your {documentCapacity.plan} plan includes {documentCapacity.document_limit} document
                  {documentCapacity.document_limit === 1 ? "" : "s"}.{" "}
                  <Link href="/app/billing" className="underline underline-offset-2">
                    Upgrade to add more.
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <DocumentUploadForm acceptedExtensions={acceptedExtensions} botId={bot.id} />
          )}

          {documents.length > 0 ? (
            <div className="divide-y rounded-md border">
              {documents.map((document) => (
                <div key={document.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-medium">{document.file_name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStatusClassName(document.status)}`}
                      >
                        {document.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(document.size_bytes)} uploaded {formatDate(document.created_at)}
                    </p>
                    {document.error_message ? <p className="text-sm text-destructive">{document.error_message}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document.status === "failed" || document.status === "queued" ? (
                      <form action={retryDocumentIngestion}>
                        <input type="hidden" name="botId" value={bot.id} />
                        <input type="hidden" name="documentId" value={document.id} />
                        <SubmitButton variant="outline" pendingLabel="Retrying...">
                          <Upload className="size-4" />
                          Retry
                        </SubmitButton>
                      </form>
                    ) : null}
                    <form action={deleteDocument}>
                      <input type="hidden" name="botId" value={bot.id} />
                      <input type="hidden" name="documentId" value={document.id} />
                      <ConfirmedSubmitButton
                        variant="outline"
                        pendingLabel="Deleting..."
                        confirmActionLabel="Delete document"
                        confirmMessage={`Delete ${document.file_name}? This removes the source and its indexed chunks.`}
                        confirmTitle="Delete document?"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </ConfirmedSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/45 p-4 text-sm text-muted-foreground">
              No documents are connected yet. Upload a source file to queue it for ingestion.
            </div>
          )}
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
            <ConfirmedSubmitButton
              variant="destructive"
              pendingLabel="Deleting..."
              confirmActionLabel="Delete bot"
              confirmMessage={`Delete ${bot.name}? This removes its documents, conversations, and widget configuration.`}
              confirmTitle="Delete this bot?"
            >
              <Trash2 className="size-4" />
              Delete bot
            </ConfirmedSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
