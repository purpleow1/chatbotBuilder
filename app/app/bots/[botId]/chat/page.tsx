import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, CircleDashed, FileText, MessageSquare, Radio } from "lucide-react";
import { BotChatClient, type ChatReadinessItem } from "@/app/app/bots/[botId]/chat/bot-chat-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { BotRecord } from "@/lib/db/bots";
import type { ChatConversationSummary } from "@/lib/db/chat";
import type { SourceDocumentRecord } from "@/lib/db/documents";

type BotApiResponse = {
  bot: BotRecord;
};

type DocumentsApiResponse = {
  documents: SourceDocumentRecord[];
};

type ConversationsApiResponse = {
  conversations: ChatConversationSummary[];
};

function buildReadiness(bot: BotRecord, documents: SourceDocumentRecord[]): ChatReadinessItem[] {
  const readyDocuments = documents.filter((document) => document.status === "ready").length;
  const hasDocuments = documents.length > 0;

  return [
    {
      id: "documents",
      label: "Documents uploaded",
      description: hasDocuments ? `${documents.length} source${documents.length === 1 ? "" : "s"} connected` : "Upload at least one source file",
      complete: hasDocuments
    },
    {
      id: "ingestion",
      label: "Ingestion ready",
      description:
        readyDocuments > 0
          ? `${readyDocuments} ready source${readyDocuments === 1 ? "" : "s"} available for answers`
          : "Wait for a source to finish processing",
      complete: readyDocuments > 0
    },
    {
      id: "widget",
      label: "Widget enabled",
      description: bot.public_widget_enabled ? "Public embed is switched on" : "Enable the public widget before embedding",
      complete: bot.public_widget_enabled
    }
  ];
}

export default async function BotChatPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const [botResult, documentsResult, conversationsResult] = await Promise.all([
    fetchInternalApi<BotApiResponse>(`/api/bots/${botId}`),
    fetchInternalApi<DocumentsApiResponse>(`/api/bots/${botId}/documents`),
    fetchInternalApi<ConversationsApiResponse>(`/api/chat?botId=${botId}`)
  ]);

  if (!botResult.ok) {
    if (botResult.status === 401) {
      redirect(`/login?next=/app/bots/${botId}/chat`);
    }

    if (botResult.status === 404) {
      notFound();
    }

    throw new Error(botResult.error.message);
  }

  const bot = botResult.data.bot;
  const documents = documentsResult.ok ? documentsResult.data.documents : [];
  const conversations = conversationsResult.ok ? conversationsResult.data.conversations : [];
  const readiness = buildReadiness(bot, documents);
  const readyDocuments = documents.filter((document) => document.status === "ready");
  const processingDocuments = documents.filter((document) => document.status === "queued" || document.status === "processing");
  const failedDocuments = documents.filter((document) => document.status === "failed");

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[680px] flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
              <Link href={`/app/bots/${bot.id}`}>
                <ArrowLeft className="size-4" />
                Settings
              </Link>
            </Button>
            <p className="text-sm font-medium text-primary">Test chat</p>
            <h1 className="text-3xl font-semibold tracking-tight">{bot.name}</h1>
            <p className="mt-2 text-muted-foreground">Ask real questions before publishing the widget.</p>
          </div>
        </div>

        {documentsResult.ok ? null : (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Knowledge readiness could not be loaded: {documentsResult.error.message}
          </div>
        )}

        {conversationsResult.ok ? null : (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Conversation history could not be loaded: {conversationsResult.error.message}
          </div>
        )}

        <BotChatClient
          botId={bot.id}
          botName={bot.name}
          initialConversations={conversations}
          fallbackMessage={bot.fallback_message}
          readyDocumentCount={readyDocuments.length}
        />
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              Readiness
            </CardTitle>
            <CardDescription>Compact setup checks for reliable answers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readiness.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-md border bg-muted/35 p-3">
                <span
                  className={
                    item.complete
                      ? "mt-0.5 text-emerald-600"
                      : "mt-0.5 text-muted-foreground"
                  }
                >
                  {item.complete ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Sources
            </CardTitle>
            <CardDescription>The chat API searches ready sources first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border bg-muted/35 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Ready
              </span>
              <span className="font-medium">{readyDocuments.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/35 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Radio className="size-4 text-blue-600" />
                Processing
              </span>
              <span className="font-medium">{processingDocuments.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/35 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CircleAlert className="size-4 text-destructive" />
                Failed
              </span>
              <span className="font-medium">{failedDocuments.length}</span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/app/bots/${bot.id}`}>
                <MessageSquare className="size-4" />
                Manage sources
              </Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
