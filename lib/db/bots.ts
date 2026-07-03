import "server-only";
import { ApiError } from "@/lib/api/errors";
import type { BotMutationInput, BotUpdateInput } from "@/lib/api/bot-validation";
import type { BotStatus, SubscriptionPlan } from "@/lib/db/database.types";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWidgetSettings } from "@/lib/widget/settings";

const botColumns =
  "id, workspace_id, created_by, name, description, purpose, support_tone, fallback_message, public_widget_enabled, status, widget_settings, created_at, updated_at";

export type BotRecord = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  purpose: string | null;
  support_tone: string | null;
  fallback_message: string | null;
  public_widget_enabled: boolean;
  status: BotStatus;
  widget_settings: unknown;
  created_at: string;
  updated_at: string;
};

export type BotListItem = BotRecord & {
  document_count: number;
  monthly_messages: number;
};

export type BotCapacity = {
  plan: SubscriptionPlan;
  bot_limit: number;
  used: number;
  can_create: boolean;
};

export async function getBotCapacity(workspaceId: string): Promise<BotCapacity> {
  const supabase = getSupabaseServiceClient();
  const [{ count, error: countError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    supabase.from("bots").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("subscriptions").select("plan, bot_limit").eq("workspace_id", workspaceId).maybeSingle()
  ]);

  if (countError) {
    throw countError;
  }

  if (subscriptionError) {
    throw subscriptionError;
  }

  const used = count ?? 0;
  const botLimit = subscription?.bot_limit ?? 1;

  return {
    plan: subscription?.plan ?? "free",
    bot_limit: botLimit,
    used,
    can_create: used < botLimit
  };
}

export async function listBotsForWorkspace(workspaceId: string): Promise<BotListItem[]> {
  const supabase = getSupabaseServiceClient();
  const { data: bots, error } = await supabase
    .from("bots")
    .select(botColumns)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (bots.length === 0) {
    return [];
  }

  const botIds = bots.map((bot) => bot.id);
  const [{ data: documents, error: documentsError }, { data: usageEvents, error: usageError }] = await Promise.all([
    supabase.from("documents").select("bot_id").eq("workspace_id", workspaceId).in("bot_id", botIds),
    supabase
      .from("usage_events")
      .select("bot_id, quantity")
      .eq("workspace_id", workspaceId)
      .eq("event_type", "message_sent")
      .in("bot_id", botIds)
  ]);

  if (documentsError) {
    throw documentsError;
  }

  if (usageError) {
    throw usageError;
  }

  const documentCounts = new Map<string, number>();
  documents.forEach((document) => {
    documentCounts.set(document.bot_id, (documentCounts.get(document.bot_id) ?? 0) + 1);
  });

  const messageCounts = new Map<string, number>();
  usageEvents.forEach((event) => {
    if (!event.bot_id) {
      return;
    }

    messageCounts.set(event.bot_id, (messageCounts.get(event.bot_id) ?? 0) + event.quantity);
  });

  return bots.map((bot) => ({
    ...bot,
    document_count: documentCounts.get(bot.id) ?? 0,
    monthly_messages: messageCounts.get(bot.id) ?? 0
  }));
}

export async function getBotForWorkspace(workspaceId: string, botId: string): Promise<BotRecord> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bots")
    .select(botColumns)
    .eq("workspace_id", workspaceId)
    .eq("id", botId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Bot not found.", "bot_not_found");
  }

  return data;
}

export async function createBotForWorkspace(workspaceId: string, userId: string, input: BotMutationInput) {
  const capacity = await getBotCapacity(workspaceId);

  if (!capacity.can_create) {
    throw new ApiError(
      403,
      `Your ${capacity.plan} plan includes ${capacity.bot_limit} bot${capacity.bot_limit === 1 ? "" : "s"}. Upgrade to create more.`,
      "bot_limit_reached"
    );
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bots")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: input.name,
      description: input.description,
      purpose: input.description,
      support_tone: input.supportTone,
      fallback_message: input.fallbackMessage,
      public_widget_enabled: input.publicWidgetEnabled,
      widget_settings: normalizeWidgetSettings(input.widgetSettings, input.name),
      status: "draft"
    })
    .select(botColumns)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBotForWorkspace(workspaceId: string, botId: string, input: BotUpdateInput) {
  await getBotForWorkspace(workspaceId, botId);

  const patch = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description, purpose: input.description } : {}),
    ...(input.supportTone !== undefined ? { support_tone: input.supportTone } : {}),
    ...(input.fallbackMessage !== undefined ? { fallback_message: input.fallbackMessage } : {}),
    ...(input.publicWidgetEnabled !== undefined ? { public_widget_enabled: input.publicWidgetEnabled } : {}),
    ...(input.widgetSettings !== undefined ? { widget_settings: input.widgetSettings } : {})
  };
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bots")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("id", botId)
    .select(botColumns)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBotForWorkspace(workspaceId: string, botId: string) {
  await getBotForWorkspace(workspaceId, botId);

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("bots").delete().eq("workspace_id", workspaceId).eq("id", botId);

  if (error) {
    throw error;
  }
}
