import "server-only";
import { ApiError } from "@/lib/api/errors";
import { GEMINI_CHAT_MODEL, generateGeminiChatResponse } from "@/lib/ai/gemini";
import { getBotForWorkspace, type BotRecord } from "@/lib/db/bots";
import type { Json, MessagePart, MessageRole } from "@/lib/db/database.types";
import { checkMonthlyMessageLimit, getPlanLimitError } from "@/lib/db/subscriptions";
import { searchBotKnowledge, type KnowledgeSearchMatch } from "@/lib/db/knowledge";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type ChatCitation = {
  documentId: string;
  chunkId: string;
  sourceName: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
};

export type ChatConversation = {
  id: string;
  workspace_id: string;
  bot_id: string;
  started_by: string | null;
  visitor_id: string | null;
  channel: "app" | "widget";
  status: "open" | "closed";
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type ChatConversationSummary = ChatConversation & {
  message_count: number;
};

export type ChatMessage = {
  id: string;
  workspace_id: string;
  bot_id: string;
  conversation_id: string;
  role: MessageRole;
  parts: Json;
  content_text: string;
  citations: Json;
  metadata: Json;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
};

export type CreateChatMessageInput = {
  botId: string;
  userId?: string;
  visitorId?: string;
  channel?: "app" | "widget";
  conversationId?: string;
  parts: MessagePart[];
};

const conversationColumns =
  "id, workspace_id, bot_id, started_by, visitor_id, channel, status, title, created_at, updated_at, last_message_at";
const messageColumns =
  "id, workspace_id, bot_id, conversation_id, role, parts, content_text, citations, metadata, input_tokens, output_tokens, created_at";

function extractTextFromParts(parts: MessagePart[]) {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "text" }> => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function createConversationTitle(messageText: string) {
  const firstLine = messageText.replace(/\s+/g, " ").trim();

  if (!firstLine) {
    return "New conversation";
  }

  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function buildCitations(matches: KnowledgeSearchMatch[]): ChatCitation[] {
  return matches.map((match) => ({
    documentId: match.document_id,
    chunkId: match.id,
    sourceName: match.file_name ?? "Knowledge source",
    chunkIndex: match.chunk_index,
    pageNumber: match.page_number,
    similarity: match.similarity
  }));
}

function buildContextBlock(matches: KnowledgeSearchMatch[]) {
  return matches
    .map((match, index) => {
      const sourceName = match.file_name ?? "Knowledge source";
      const page = match.page_number ? `, page ${match.page_number}` : "";

      return `[${index + 1}] ${sourceName}${page}, chunk ${match.chunk_index + 1}\n${match.content}`;
    })
    .join("\n\n");
}

function buildConversationHistoryBlock(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content_text.trim()}`)
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildRetrievalQuery(userText: string, messages: ChatMessage[]) {
  const recentUserTurns = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content_text.trim())
    .filter(Boolean);

  if (recentUserTurns.length === 0) {
    return userText;
  }

  return [...recentUserTurns, userText].join("\n");
}

function buildFallbackAnswer(bot: BotRecord) {
  return (
    bot.fallback_message?.trim() ||
    "I do not have enough information in the uploaded knowledge sources to answer that confidently."
  );
}

function buildGroundedPrompt(bot: BotRecord, userText: string, matches: KnowledgeSearchMatch[], priorMessages: ChatMessage[]) {
  const tone = bot.support_tone?.trim() || "helpful, concise, and professional";
  const purpose = bot.purpose?.trim() || bot.description?.trim() || "answer customer support questions";
  const history = buildConversationHistoryBlock(priorMessages);

  return `You are ${bot.name}, a support assistant for this HelpDock AI bot.

Purpose: ${purpose}
Tone: ${tone}

Use the recent conversation only to understand follow-up questions, pronouns, and topic references. Use only the knowledge context below as the source of factual claims. If the answer is not in the knowledge context, say you do not have enough information and ask for a more specific question or suggest contacting support. Do not invent policy, pricing, setup, legal, or troubleshooting details.

Recent conversation:
${history || "No prior turns."}

Knowledge context:
${buildContextBlock(matches)}

User question:
${userText}

Answer in plain text. When you rely on a source, mention the source name naturally.`;
}

async function getRecentConversationMessages(workspaceId: string, botId: string, conversationId: string, limit = 8) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .select(messageColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ChatMessage[]).reverse();
}

async function getExistingConversation(
  workspaceId: string,
  botId: string,
  conversationId: string,
  options: { channel?: "app" | "widget"; visitorId?: string } = {}
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(conversationColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Conversation not found for this bot.", "conversation_not_found");
  }

  if (data.status !== "open") {
    throw new ApiError(409, "This conversation is closed.", "conversation_closed");
  }

  if (options.channel && data.channel !== options.channel) {
    throw new ApiError(404, "Conversation not found for this bot.", "conversation_not_found");
  }

  if (options.channel === "widget" && data.visitor_id !== options.visitorId) {
    throw new ApiError(404, "Conversation not found for this visitor.", "conversation_not_found");
  }

  return data as ChatConversation;
}

async function createConversation(input: {
  workspaceId: string;
  botId: string;
  userId?: string;
  visitorId?: string;
  channel: "app" | "widget";
  title: string;
}) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      workspace_id: input.workspaceId,
      bot_id: input.botId,
      started_by: input.userId,
      visitor_id: input.visitorId,
      channel: input.channel,
      title: input.title,
      last_message_at: new Date().toISOString()
    })
    .select(conversationColumns)
    .single();

  if (error) {
    throw error;
  }

  return data as ChatConversation;
}

async function insertMessage(input: {
  workspaceId: string;
  botId: string;
  conversationId: string;
  role: MessageRole;
  parts: MessagePart[];
  contentText: string;
  citations?: ChatCitation[];
  metadata?: Record<string, Json | undefined>;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      workspace_id: input.workspaceId,
      bot_id: input.botId,
      conversation_id: input.conversationId,
      role: input.role,
      parts: toJson(input.parts),
      content_text: input.contentText,
      citations: toJson(input.citations ?? []),
      metadata: toJson(input.metadata ?? {}),
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null
    })
    .select(messageColumns)
    .single();

  if (error) {
    throw error;
  }

  return data as ChatMessage;
}

export async function createChatTurn(workspaceId: string, input: CreateChatMessageInput) {
  const bot = await getBotForWorkspace(workspaceId, input.botId);
  const channel = input.channel ?? "app";

  const messageCheck = await checkMonthlyMessageLimit(workspaceId);

  if (!messageCheck.allowed) {
    throw getPlanLimitError(messageCheck.plan, "messages");
  }

  if (bot.status === "disabled") {
    throw new ApiError(403, "This bot is disabled.", "bot_disabled");
  }

  if (channel === "widget" && !input.visitorId) {
    throw new ApiError(400, "Widget chat requires a visitor id.", "missing_visitor_id");
  }

  const userText = extractTextFromParts(input.parts);

  if (!userText) {
    throw new ApiError(400, "Send at least one text message part.", "missing_message_text");
  }

  const conversation = input.conversationId
    ? await getExistingConversation(workspaceId, input.botId, input.conversationId, {
        channel,
        visitorId: input.visitorId
      })
    : await createConversation({
        workspaceId,
        botId: input.botId,
        userId: input.userId,
        visitorId: input.visitorId,
        channel,
        title: createConversationTitle(userText)
      });
  const priorMessages = input.conversationId
    ? await getRecentConversationMessages(workspaceId, input.botId, conversation.id)
    : [];

  const userMessage = await insertMessage({
    workspaceId,
    botId: input.botId,
    conversationId: conversation.id,
    role: "user",
    parts: input.parts,
    contentText: userText,
    metadata: {
      source: "api_chat"
    }
  });
  const matches = await searchBotKnowledge(workspaceId, input.botId, buildRetrievalQuery(userText, priorMessages), 5);
  const relevantMatches = matches.filter((match) => match.similarity >= 0.15);
  const citations = buildCitations(relevantMatches);
  const chatResult =
    relevantMatches.length > 0
      ? await generateGeminiChatResponse(buildGroundedPrompt(bot, userText, relevantMatches, priorMessages))
      : {
          text: buildFallbackAnswer(bot),
          inputTokens: null,
          outputTokens: null,
          model: GEMINI_CHAT_MODEL,
          finishReason: "NO_RELEVANT_CONTEXT"
        };
  const assistantMessage = await insertMessage({
    workspaceId,
    botId: input.botId,
    conversationId: conversation.id,
    role: "assistant",
    parts: [
      {
        type: "text",
        text: chatResult.text
      }
    ],
    contentText: chatResult.text,
    citations,
    metadata: {
      model: chatResult.model,
      finishReason: chatResult.finishReason,
      matchCount: relevantMatches.length,
      userMessageId: userMessage.id
    },
    inputTokens: chatResult.inputTokens,
    outputTokens: chatResult.outputTokens
  });
  const supabase = getSupabaseServiceClient();

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("bot_id", input.botId)
    .eq("id", conversation.id);

  await supabase.from("usage_events").insert([
    {
      workspace_id: workspaceId,
      bot_id: input.botId,
      conversation_id: conversation.id,
      message_id: userMessage.id,
      event_type: "message_sent",
      quantity: 1,
      metadata: {
        channel: conversation.channel
      }
    },
    {
      workspace_id: workspaceId,
      bot_id: input.botId,
      conversation_id: conversation.id,
      message_id: assistantMessage.id,
      event_type: "assistant_response",
      quantity: 1,
      metadata: {
        model: chatResult.model,
        matchCount: relevantMatches.length
      }
    }
  ]);

  return {
    conversation,
    userMessage,
    assistantMessage,
    citations,
    matches: relevantMatches
  };
}

export async function listChatConversations(
  workspaceId: string,
  botId: string,
  options: { channel?: "app" | "widget"; visitorId?: string; limit?: number } = {}
) {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("conversations")
    .select(conversationColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("status", "open")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(options.limit ?? 20);

  if (options.channel) {
    query = query.eq("channel", options.channel);
  }

  if (options.channel === "widget") {
    query = query.eq("visitor_id", options.visitorId ?? "");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as ChatConversation[]).map((conversation) => ({
    ...conversation,
    message_count: 0
  }));
}

export async function getChatConversation(
  workspaceId: string,
  botId: string,
  conversationId: string,
  options: { channel?: "app" | "widget"; visitorId?: string } = {}
) {
  await getBotForWorkspace(workspaceId, botId);

  const conversation = await getExistingConversation(workspaceId, botId, conversationId, options);
  const supabase = getSupabaseServiceClient();
  const { data: messages, error } = await supabase
    .from("messages")
    .select(messageColumns)
    .eq("workspace_id", workspaceId)
    .eq("bot_id", botId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    conversation,
    messages: messages as ChatMessage[]
  };
}
