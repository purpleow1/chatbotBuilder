"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileText, Loader2, MessageSquare, Plus, Send, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatReadinessItem = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
};

type ChatCitation = {
  documentId: string;
  chunkId: string;
  sourceName: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ChatCitation[];
};

type ChatConversationSummary = {
  id: string;
  channel: "app" | "widget";
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  message_count?: number;
};

type ChatApiMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content_text: string;
  citations?: unknown;
};

type ChatApiResponse = {
  conversation: ChatConversationSummary;
  messages: {
    user: ChatApiMessage;
    assistant: ChatApiMessage;
  };
  answer: {
    citations?: ChatCitation[];
  };
};

type ChatLoadApiResponse = {
  conversation: ChatConversationSummary;
  messages: ChatApiMessage[];
};

type BotChatClientProps = {
  botId: string;
  botName: string;
  initialConversations: ChatConversationSummary[];
  fallbackMessage: string | null;
  readyDocumentCount: number;
};

function createGreeting(botName: string, readyDocumentCount: number): ChatMessage {
  return {
    id: "greeting",
    role: "assistant",
    content:
      readyDocumentCount > 0
        ? `Hi, I am ${botName}. Ask me anything from the uploaded knowledge sources.`
        : `Hi, I am ${botName}. Upload and ingest a source document before expecting grounded answers.`,
    citations: []
  };
}

function parseCitations(value: unknown): ChatCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((citation): citation is ChatCitation => {
    if (!citation || typeof citation !== "object") {
      return false;
    }

    const candidate = citation as Partial<ChatCitation>;

    return (
      typeof candidate.documentId === "string" &&
      typeof candidate.chunkId === "string" &&
      typeof candidate.sourceName === "string" &&
      typeof candidate.chunkIndex === "number" &&
      typeof candidate.similarity === "number"
    );
  });
}

function messageFromApi(message: ChatApiMessage, fallbackCitations: ChatCitation[] = []): ChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content_text,
    citations: message.role === "assistant" ? uniqueCitations(parseCitations(message.citations).concat(fallbackCitations)).slice(0, 5) : []
  };
}

function getApiErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;

    if (typeof error?.message === "string") {
      return error.message;
    }
  }

  return `Chat request failed with HTTP ${status}.`;
}

function uniqueCitations(citations: ChatCitation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = citation.chunkId;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatConversationTime(value: string | null) {
  if (!value) {
    return "No messages yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getConversationTitle(conversation: ChatConversationSummary) {
  return conversation.title?.trim() || "New conversation";
}

function sortConversations(conversations: ChatConversationSummary[]) {
  return [...conversations].sort((a, b) => {
    const aTime = new Date(a.last_message_at ?? a.created_at).getTime();
    const bTime = new Date(b.last_message_at ?? b.created_at).getTime();

    return bTime - aTime;
  });
}

function upsertConversation(conversations: ChatConversationSummary[], next: ChatConversationSummary) {
  return sortConversations([next, ...conversations.filter((conversation) => conversation.id !== next.id)]);
}

export function BotChatClient({
  botId,
  botName,
  initialConversations,
  fallbackMessage,
  readyDocumentCount
}: BotChatClientProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>(() => sortConversations(initialConversations));
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createGreeting(botName, readyDocumentCount)]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trimmedInput = input.trim();
  const canSend = trimmedInput.length > 0 && !isSending && !loadingConversationId;
  const fallbackPreview = useMemo(
    () => fallbackMessage?.trim() || "The bot will say it does not have enough information when knowledge is missing.",
    [fallbackMessage]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isSending]);

  async function loadConversation(nextConversationId: string) {
    if (nextConversationId === conversationId || loadingConversationId) {
      return;
    }

    setLoadingConversationId(nextConversationId);
    setError(null);

    try {
      const response = await fetch(`/api/chat?botId=${botId}&conversationId=${nextConversationId}`);
      const payload = (await response.json().catch(() => null)) as ChatLoadApiResponse | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }

      const chatPayload = payload as ChatLoadApiResponse;
      const loadedMessages = chatPayload.messages
        .map((message) => messageFromApi(message))
        .filter((message): message is ChatMessage => Boolean(message));

      setConversationId(chatPayload.conversation.id);
      setConversations((current) => upsertConversation(current, chatPayload.conversation));
      setMessages(loadedMessages.length > 0 ? loadedMessages : [createGreeting(botName, readyDocumentCount)]);
      setInput("");
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "The conversation could not be loaded.");
    } finally {
      setLoadingConversationId(null);
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!canSend) {
      return;
    }

    const localUserMessage: ChatMessage = {
      id: `local-${crypto.randomUUID()}`,
      role: "user",
      content: trimmedInput,
      citations: []
    };

    setMessages((current) => [...current, localUserMessage]);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          botId,
          conversationId: conversationId ?? undefined,
          message: {
            parts: [
              {
                type: "text",
                text: trimmedInput
              }
            ]
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as ChatApiResponse | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }

      const chatPayload = payload as ChatApiResponse;
      const persistedUser = messageFromApi(chatPayload.messages.user);
      const persistedAssistant = messageFromApi(
        chatPayload.messages.assistant,
        uniqueCitations(chatPayload.answer.citations ?? [])
      );

      setConversationId(chatPayload.conversation.id);
      setConversations((current) => upsertConversation(current, chatPayload.conversation));
      setMessages((current) => {
        const withoutLocal = current.filter((message) => message.id !== localUserMessage.id);

        return [
          ...withoutLocal,
          ...(persistedUser ? [persistedUser] : [localUserMessage]),
          ...(persistedAssistant ? [persistedAssistant] : [])
        ];
      });
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "The chat request failed.");
      setMessages((current) => current.filter((message) => message.id !== localUserMessage.id));
      setInput(trimmedInput);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([createGreeting(botName, readyDocumentCount)]);
    setInput("");
    setError(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:flex-row">
      <aside className="flex max-h-64 flex-col border-b bg-muted/25 lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Conversations</p>
            <p className="text-xs text-muted-foreground">{conversations.length} recent chat{conversations.length === 1 ? "" : "s"}</p>
          </div>
          <Button type="button" variant="outline" size="icon" aria-label="New chat" onClick={startNewChat}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const isActive = conversation.id === conversationId;
              const isLoading = loadingConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void loadConversation(conversation.id)}
                  className={cn(
                    "w-full rounded-md border bg-background p-3 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5",
                    isActive && "border-primary bg-primary/10"
                  )}
                  disabled={Boolean(loadingConversationId) || isSending}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {isLoading ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <MessageSquare className="size-4 shrink-0 text-primary" />}
                    <span className="truncate font-medium">{getConversationTitle(conversation)}</span>
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Clock3 className="size-3" />
                      {formatConversationTime(conversation.last_message_at)}
                    </span>
                    <span>{conversation.channel}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              Chats you start here will stay available for later testing.
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{botName}</h2>
              <p className="text-sm text-muted-foreground">
                {conversationId ? "Conversation active" : "New chat"}
              </p>
            </div>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={startNewChat}>
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-muted/35 p-4">
        {loadingConversationId ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading conversation...
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <article
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[min(42rem,86%)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border bg-background text-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  Grounded answer
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.citations.length > 0 ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {message.citations.map((citation) => (
                      <span
                        key={citation.chunkId}
                        className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        <FileText className="size-3 shrink-0" />
                        <span className="truncate">
                          {citation.sourceName}
                          {citation.pageNumber ? `, page ${citation.pageNumber}` : ""} - chunk {citation.chunkIndex + 1}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {isSending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Searching sources and drafting an answer...
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="inline-flex items-center gap-2">
            <TriangleAlert className="size-4" />
            {error}
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3 border-t bg-background p-4">
        {readyDocumentCount === 0 ? (
          <div className="flex items-start gap-2 rounded-md border bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>No ready sources yet. Fallback preview: {fallbackPreview}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {readyDocumentCount} ready source{readyDocumentCount === 1 ? "" : "s"} available for retrieval.
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question from your uploaded docs..."
            className="min-h-11 resize-none"
            rows={1}
            maxLength={4000}
            disabled={isSending || Boolean(loadingConversationId)}
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!canSend}>
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
