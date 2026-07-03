import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { apiErrorResponse } from "@/lib/api/errors";
import {
  applyStripeSubscription,
  cancelStripeSubscription,
  getSubscriptionByStripeId,
  resolveStripePlanFromPriceId,
  resolveStripeStatusToSubscriptionStatus
} from "@/lib/db/subscriptions";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";

async function verifyWebhookSignature(request: NextRequest): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    throw new Error("Missing stripe-signature header.");
  }

  const stripe = getStripeClient();

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspace_id;
  const plan = session.metadata?.plan;

  if (!workspaceId || !plan) {
    console.warn("Stripe webhook: checkout.session.completed missing workspace_id or plan metadata.", { sessionId: session.id });

    return;
  }

  const stripe = getStripeClient();
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!stripeSubscriptionId) {
    console.warn("Stripe webhook: checkout.session.completed has no subscription.", { sessionId: session.id });

    return;
  }

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!stripeCustomerId) {
    console.warn("Stripe webhook: checkout.session.completed has no customer.", { sessionId: session.id });

    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  const resolvedPlan = resolveStripePlanFromPriceId(priceId) ?? (plan as "pro" | "business");
  const status = resolveStripeStatusToSubscriptionStatus(subscription.status);
  const periodStart = firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : new Date().toISOString();
  const periodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await applyStripeSubscription({
    workspaceId,
    stripeCustomerId,
    stripeSubscriptionId,
    plan: resolvedPlan,
    periodStart,
    periodEnd,
    status
  });
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const existing = await getSubscriptionByStripeId(stripeSubscription.id);

  if (!existing) {
    console.warn("Stripe webhook: customer.subscription.updated for unknown subscription.", {
      stripeSubscriptionId: stripeSubscription.id
    });

    return;
  }

  const firstItem = stripeSubscription.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  const resolvedPlan = resolveStripePlanFromPriceId(priceId) ?? existing.plan;
  const status = resolveStripeStatusToSubscriptionStatus(stripeSubscription.status);
  const stripeCustomerId =
    typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : stripeSubscription.customer.id;
  const periodStart = firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : new Date().toISOString();
  const periodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await applyStripeSubscription({
    workspaceId: existing.workspace_id,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubscription.id,
    plan: resolvedPlan,
    periodStart,
    periodEnd,
    status
  });
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const existing = await getSubscriptionByStripeId(stripeSubscription.id);

  if (!existing) {
    console.warn("Stripe webhook: customer.subscription.deleted for unknown subscription.", {
      stripeSubscriptionId: stripeSubscription.id
    });

    return;
  }

  await cancelStripeSubscription(existing.workspace_id);
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: { code: "stripe_not_configured", message: "Stripe is not enabled." } }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = await verifyWebhookSignature(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";

    return NextResponse.json({ error: { code: "webhook_signature_error", message } }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return apiErrorResponse(error, `Stripe webhook ${event.type}`);
  }
}
