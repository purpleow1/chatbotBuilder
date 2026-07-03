import "server-only";
import type { SubscriptionPlan } from "@/lib/db/database.types";
import { PLAN_CONFIGS } from "@/lib/plans";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";

export type CreateCheckoutSessionParams = {
  workspaceId: string;
  userEmail: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  existingStripeCustomerId?: string | null;
};

export type CheckoutSessionResult =
  | { type: "redirect"; url: string }
  | { type: "error"; message: string };

export function getStripePriceId(plan: SubscriptionPlan): string | null {
  const envVar = PLAN_CONFIGS[plan].stripePriceIdEnvVar;

  if (!envVar) return null;

  const value = process.env[envVar];

  return value && value.length > 0 ? value : null;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  if (!isStripeConfigured()) {
    return { type: "error", message: "Stripe is not configured." };
  }

  const priceId = getStripePriceId(params.plan);

  if (!priceId) {
    return { type: "error", message: `No Stripe price ID is configured for the ${params.plan} plan.` };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.existingStripeCustomerId ?? undefined,
    customer_email: params.existingStripeCustomerId ? undefined : params.userEmail,
    metadata: {
      workspace_id: params.workspaceId,
      plan: params.plan
    },
    subscription_data: {
      metadata: {
        workspace_id: params.workspaceId,
        plan: params.plan
      }
    }
  });

  if (!session.url) {
    return { type: "error", message: "Failed to create Stripe checkout session URL." };
  }

  return { type: "redirect", url: session.url };
}

export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string | null> {
  if (!isStripeConfigured()) return null;

  const stripe = getStripeClient();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.stripeCustomerId,
      return_url: params.returnUrl
    });

    return session.url;
  } catch {
    return null;
  }
}
