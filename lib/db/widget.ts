import "server-only";
import { ApiError } from "@/lib/api/errors";
import {
  createChatTurn,
  getChatConversation,
  type ChatCitation,
  type ChatConversation,
  type ChatMessage
} from "@/lib/db/chat";
import type { BotRecord } from "@/lib/db/bots";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/db/database.types";
import { planRemovesBranding } from "@/lib/plans";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { applyWidgetPlanLimits, normalizeWidgetSettings, type WidgetSettings } from "@/lib/widget/settings";

const botColumns =
  "id, workspace_id, created_by, name, description, purpose, support_tone, fallback_message, public_widget_enabled, status, widget_settings, created_at, updated_at";

type WidgetAvailability = {
  bot: BotRecord;
  settings: WidgetSettings;
  plan: SubscriptionPlan;
};

type WidgetChatInput = {
  botId: string;
  conversationId?: string;
  visitorId: string;
  text: string;
};

export type PublicWidgetConfig = {
  botId: string;
  name: string;
  description: string | null;
  settings: WidgetSettings;
  showBranding: boolean;
};

async function getPublicBot(botId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("bots").select(botColumns).eq("id", botId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Widget not found.", "widget_not_found");
  }

  return data as BotRecord;
}

async function ensurePlanAllowsWidget(bot: BotRecord): Promise<SubscriptionPlan> {
  const supabase = getSupabaseServiceClient();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan, status, monthly_message_limit, current_period_start, current_period_end")
    .eq("workspace_id", bot.workspace_id)
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const plan = (subscription?.plan ?? "free") as SubscriptionPlan;
  const status = subscription?.status as SubscriptionStatus | undefined;

  if (status === "canceled" || status === "past_due") {
    throw new ApiError(402, "This widget is unavailable until billing is restored.", "widget_billing_blocked");
  }

  const monthlyLimit = subscription?.monthly_message_limit ?? 100;
  const periodStart = subscription?.current_period_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const periodEnd = subscription?.current_period_end ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
  const { data: usageEvents, error: usageError } = await supabase
    .from("usage_events")
    .select("quantity")
    .eq("workspace_id", bot.workspace_id)
    .eq("event_type", "message_sent")
    .gte("occurred_at", periodStart)
    .lt("occurred_at", periodEnd);

  if (usageError) {
    throw usageError;
  }

  const used = usageEvents.reduce((total, event) => total + event.quantity, 0);

  if (used >= monthlyLimit) {
    throw new ApiError(402, "This widget has reached its monthly message limit.", "widget_message_limit_reached");
  }

  return plan;
}

export async function getPublicWidgetAvailability(botId: string): Promise<WidgetAvailability> {
  const bot = await getPublicBot(botId);

  if (!bot.public_widget_enabled) {
    throw new ApiError(403, "This widget is not public.", "widget_disabled");
  }

  if (bot.status === "disabled") {
    throw new ApiError(403, "This bot is disabled.", "bot_disabled");
  }

  const plan = await ensurePlanAllowsWidget(bot);
  const rawSettings = normalizeWidgetSettings(bot.widget_settings, bot.name);
  const settings = applyWidgetPlanLimits(rawSettings, plan);

  return {
    bot,
    settings,
    plan
  };
}

export async function getPublicWidgetConfig(botId: string): Promise<PublicWidgetConfig> {
  const { bot, settings, plan } = await getPublicWidgetAvailability(botId);
  const supabase = getSupabaseServiceClient();

  await supabase.from("usage_events").insert({
    workspace_id: bot.workspace_id,
    bot_id: bot.id,
    event_type: "widget_loaded",
    quantity: 1,
    metadata: {
      source: "widget"
    }
  });

  return {
    botId: bot.id,
    name: bot.name,
    description: bot.description,
    settings,
    showBranding: !planRemovesBranding(plan)
  };
}

export async function createWidgetChatTurn(input: WidgetChatInput): Promise<{
  conversation: ChatConversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  citations: ChatCitation[];
}> {
  const { bot } = await getPublicWidgetAvailability(input.botId);

  return createChatTurn(bot.workspace_id, {
    botId: bot.id,
    conversationId: input.conversationId,
    visitorId: input.visitorId,
    channel: "widget",
    parts: [
      {
        type: "text",
        text: input.text
      }
    ]
  });
}

export async function getWidgetChatConversation(input: {
  botId: string;
  conversationId: string;
  visitorId: string;
}): Promise<{
  conversation: ChatConversation;
  messages: ChatMessage[];
}> {
  const { bot } = await getPublicWidgetAvailability(input.botId);

  return getChatConversation(bot.workspace_id, bot.id, input.conversationId, {
    channel: "widget",
    visitorId: input.visitorId
  });
}
