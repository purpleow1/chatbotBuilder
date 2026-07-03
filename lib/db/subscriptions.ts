import "server-only";
import { ApiError } from "@/lib/api/errors";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/db/database.types";
import { PLAN_CONFIGS } from "@/lib/plans";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const subscriptionColumns =
  "id, workspace_id, plan, status, billing_provider, stripe_customer_id, stripe_subscription_id, bot_limit, document_limit, monthly_message_limit, current_period_start, current_period_end, updated_at";

export type SubscriptionRecord = {
  id: string;
  workspace_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_provider: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  bot_limit: number;
  document_limit: number;
  monthly_message_limit: number;
  current_period_start: string;
  current_period_end: string;
  updated_at: string;
};

export type WorkspaceUsage = {
  botCount: number;
  documentCount: number;
  monthlyMessageCount: number;
};

export type SubscriptionWithUsage = {
  subscription: SubscriptionRecord;
  usage: WorkspaceUsage;
};

export type MessageLimitCheck = {
  allowed: boolean;
  used: number;
  limit: number;
  plan: SubscriptionPlan;
};

export async function getOrCreateSubscription(workspaceId: string): Promise<SubscriptionRecord> {
  const supabase = getSupabaseServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select(subscriptionColumns)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as SubscriptionRecord;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ workspace_id: workspaceId })
    .select(subscriptionColumns)
    .single();

  if (error) {
    throw error;
  }

  return data as SubscriptionRecord;
}

export async function getSubscriptionWithUsage(workspaceId: string): Promise<SubscriptionWithUsage> {
  const supabase = getSupabaseServiceClient();
  const subscription = await getOrCreateSubscription(workspaceId);

  const [{ count: botCount, error: botError }, { count: docCount, error: docError }, { data: usageData, error: usageError }] =
    await Promise.all([
      supabase.from("bots").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase
        .from("usage_events")
        .select("quantity")
        .eq("workspace_id", workspaceId)
        .eq("event_type", "message_sent")
        .gte("occurred_at", subscription.current_period_start)
        .lt("occurred_at", subscription.current_period_end)
    ]);

  if (botError) throw botError;
  if (docError) throw docError;
  if (usageError) throw usageError;

  const monthlyMessageCount = (usageData ?? []).reduce((sum, e) => sum + e.quantity, 0);

  return {
    subscription,
    usage: {
      botCount: botCount ?? 0,
      documentCount: docCount ?? 0,
      monthlyMessageCount
    }
  };
}

export async function checkMonthlyMessageLimit(workspaceId: string): Promise<MessageLimitCheck> {
  const supabase = getSupabaseServiceClient();
  const subscription = await getOrCreateSubscription(workspaceId);
  const { data: usageData, error } = await supabase
    .from("usage_events")
    .select("quantity")
    .eq("workspace_id", workspaceId)
    .eq("event_type", "message_sent")
    .gte("occurred_at", subscription.current_period_start)
    .lt("occurred_at", subscription.current_period_end);

  if (error) throw error;

  const used = (usageData ?? []).reduce((sum, e) => sum + e.quantity, 0);
  const limit = subscription.monthly_message_limit;

  return {
    allowed: used < limit,
    used,
    limit,
    plan: subscription.plan
  };
}

export async function upgradeSubscriptionMock(workspaceId: string, targetPlan: SubscriptionPlan): Promise<SubscriptionRecord> {
  const planConfig = PLAN_CONFIGS[targetPlan];
  const supabase = getSupabaseServiceClient();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      plan: targetPlan,
      status: "mock_active",
      billing_provider: "mock",
      bot_limit: planConfig.botLimit,
      document_limit: planConfig.documentLimit,
      monthly_message_limit: planConfig.monthlyMessageLimit,
      current_period_start: periodStart,
      current_period_end: periodEnd
    })
    .eq("workspace_id", workspaceId)
    .select(subscriptionColumns)
    .single();

  if (error) throw error;

  return data as SubscriptionRecord;
}

export async function applyStripeSubscription(params: {
  workspaceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionPlan;
  periodStart: string;
  periodEnd: string;
  status: SubscriptionStatus;
}): Promise<void> {
  const planConfig = PLAN_CONFIGS[params.plan];
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: params.plan,
      status: params.status,
      billing_provider: "stripe",
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      bot_limit: planConfig.botLimit,
      document_limit: planConfig.documentLimit,
      monthly_message_limit: planConfig.monthlyMessageLimit,
      current_period_start: params.periodStart,
      current_period_end: params.periodEnd
    })
    .eq("workspace_id", params.workspaceId);

  if (error) throw error;
}

export async function cancelStripeSubscription(workspaceId: string): Promise<void> {
  const freePlan = PLAN_CONFIGS["free"];
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      billing_provider: "stripe",
      bot_limit: freePlan.botLimit,
      document_limit: freePlan.documentLimit,
      monthly_message_limit: freePlan.monthlyMessageLimit
    })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(subscriptionColumns)
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error) throw error;

  return data as SubscriptionRecord | null;
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<SubscriptionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(subscriptionColumns)
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) throw error;

  return data as SubscriptionRecord | null;
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "mock_active" || status === "trialing";
}

export function planDisplayName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business"
  };

  return names[plan];
}

export function resolveStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "past_due"
  };

  return map[stripeStatus] ?? "active";
}

export function resolveStripePlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID;

  if (proPriceId && priceId === proPriceId) return "pro";
  if (businessPriceId && priceId === businessPriceId) return "business";

  return null;
}

export function getPlanLimitError(plan: SubscriptionPlan, limitType: "messages"): ApiError {
  const config = PLAN_CONFIGS[plan];

  if (limitType === "messages") {
    return new ApiError(
      402,
      `Your ${config.name} plan includes ${config.monthlyMessageLimit} monthly messages. Upgrade to send more.`,
      "monthly_message_limit_reached"
    );
  }

  return new ApiError(402, "Plan limit reached. Upgrade to continue.", "plan_limit_reached");
}
