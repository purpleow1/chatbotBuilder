"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Loader2, MessageCircle, RotateCcw, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PublicWidgetConfig } from "@/lib/db/widget";

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

type WidgetChatApiMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content_text: string;
  citations?: unknown;
};

type WidgetChatApiResponse = {
  conversation: {
    id: string;
  };
  messages: {
    user: WidgetChatApiMessage;
    assistant: WidgetChatApiMessage;
  };
  answer: {
    citations?: ChatCitation[];
  };
};

type WidgetChatLoadApiResponse = {
  conversation: {
    id: string;
  };
  messages: WidgetChatApiMessage[];
};

type WidgetChatClientProps = {
  widget: PublicWidgetConfig;
  className?: string;
};

function getVisitorId(botId: string) {
  const key = `askdoc:${botId}:visitor`;
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created = `visitor_${crypto.randomUUID()}`;

  window.localStorage.setItem(key, created);
  return created;
}

function getConversationStorageKey(botId: string, visitorId: string) {
  return `askdoc:${botId}:${visitorId}:conversation`;
}

function createWelcomeMessage(message: string): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: message,
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

function uniqueCitations(citations: ChatCitation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    if (seen.has(citation.chunkId)) {
      return false;
    }

    seen.add(citation.chunkId);
    return true;
  });
}

function messageFromApi(message: WidgetChatApiMessage, fallbackCitations: ChatCitation[] = []): ChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content_text,
    citations: message.role === "assistant" ? uniqueCitations(parseCitations(message.citations).concat(fallbackCitations)).slice(0, 3) : []
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

export function WidgetChatClient({ widget, className }: WidgetChatClientProps) {
  const { settings } = widget;
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage(settings.welcomeMessage)]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trimmedInput = input.trim();
  const canSend = Boolean(visitorId) && trimmedInput.length > 0 && !isSending && !isLoadingHistory;
  const themeStyle = useMemo(
    () =>
      ({
        "--widget-primary": settings.primaryColor
      }) as CSSProperties,
    [settings.primaryColor]
  );

  useEffect(() => {
    setVisitorId(getVisitorId(widget.botId));
  }, [widget.botId]);

  useEffect(() => {
    if (!visitorId) {
      return;
    }

    const storedConversationId = window.localStorage.getItem(getConversationStorageKey(widget.botId, visitorId));

    if (!storedConversationId) {
      return;
    }

    const currentVisitorId = visitorId;
    const currentConversationId = storedConversationId;
    let canceled = false;

    async function loadStoredConversation() {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          conversationId: currentConversationId,
          visitorId: currentVisitorId
        });
        const response = await fetch(`/api/widget/${widget.botId}/chat?${params.toString()}`);
        const payload = (await response.json().catch(() => null)) as WidgetChatLoadApiResponse | unknown;

        if (!response.ok) {
          window.localStorage.removeItem(getConversationStorageKey(widget.botId, currentVisitorId));
          return;
        }

        if (canceled) {
          return;
        }

        const chatPayload = payload as WidgetChatLoadApiResponse;
        const loadedMessages = chatPayload.messages
          .map((message) => messageFromApi(message))
          .filter((message): message is ChatMessage => Boolean(message));

        setConversationId(chatPayload.conversation.id);
        setMessages(loadedMessages.length > 0 ? loadedMessages : [createWelcomeMessage(settings.welcomeMessage)]);
      } catch {
        window.localStorage.removeItem(getConversationStorageKey(widget.botId, currentVisitorId));
      } finally {
        if (!canceled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadStoredConversation();

    return () => {
      canceled = true;
    };
  }, [settings.welcomeMessage, visitorId, widget.botId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isSending]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!canSend || !visitorId) {
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
      const response = await fetch(`/api/widget/${widget.botId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          visitorId,
          message: {
            text: trimmedInput
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as WidgetChatApiResponse | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }

      const chatPayload = payload as WidgetChatApiResponse;
      const persistedUser = messageFromApi(chatPayload.messages.user);
      const persistedAssistant = messageFromApi(
        chatPayload.messages.assistant,
        uniqueCitations(chatPayload.answer.citations ?? [])
      );

      setConversationId(chatPayload.conversation.id);
      window.localStorage.setItem(getConversationStorageKey(widget.botId, visitorId), chatPayload.conversation.id);
      setMessages((current) => {
        const withoutLocal = current.filter((message) => message.id !== localUserMessage.id);

        return [
          ...withoutLocal,
          ...(persistedUser ? [persistedUser] : [localUserMessage]),
          ...(persistedAssistant ? [persistedAssistant] : [])
        ];
      });
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "The widget chat request failed.");
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

  function startOver() {
    if (visitorId) {
      window.localStorage.removeItem(getConversationStorageKey(widget.botId, visitorId));
    }

    setConversationId(null);
    setMessages([createWelcomeMessage(settings.welcomeMessage)]);
    setInput("");
    setError(null);
  }

  return (
    <section
      className={cn("flex h-dvh min-h-[420px] w-full flex-col overflow-hidden bg-white text-slate-950", className)}
      style={themeStyle}
    >
      <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: settings.primaryColor }}>
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/18 text-sm font-semibold">
          {settings.botAvatarInitials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{settings.botDisplayName}</h1>
          <p className="truncate text-xs text-white/80">{widget.description || "Answers from our knowledge base"}</p>
        </div>
        <button
          type="button"
          onClick={startOver}
          aria-label="Start a new chat"
          className="grid size-9 shrink-0 place-items-center rounded-md text-white/85 transition hover:bg-white/15 hover:text-white"
        >
          <RotateCcw className="size-4" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {isLoadingHistory ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading conversation...
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <article key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm",
                message.role === "user" ? "text-white" : "border border-slate-200 bg-white text-slate-800"
              )}
              style={message.role === "user" ? { backgroundColor: settings.primaryColor } : undefined}
            >
              {message.role === "assistant" ? (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: settings.primaryColor }}>
                  <MessageCircle className="size-3.5" />
                  Answer
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </article>
        ))}

        {isSending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
              <Loader2 className="size-4 animate-spin" />
              Searching sources...
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span className="inline-flex items-center gap-2">
            <TriangleAlert className="size-4" />
            {error}
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="min-h-11 resize-none border-slate-300 text-sm focus-visible:ring-[var(--widget-primary)]"
            rows={1}
            maxLength={4000}
            disabled={isSending || isLoadingHistory}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!canSend}
            className="shrink-0 border-0 text-white hover:opacity-90"
            style={{ backgroundColor: settings.primaryColor }}
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </form>

      {widget.showBranding && (
        <div className="border-t border-slate-100 bg-white px-4 py-2 text-center text-xs text-slate-400">
          Powered by{" "}
          <span className="font-medium text-slate-500">AskDoc</span>
        </div>
      )}
    </section>
  );
}
