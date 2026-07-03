import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { applyAuthCookies, authenticateRequest } from "@/lib/db/auth";
import { ensureAccountForUser } from "@/lib/db/onboarding";
import { getSubscriptionWithUsage, upgradeSubscriptionMock } from "@/lib/db/subscriptions";
import type { SubscriptionPlan } from "@/lib/db/database.types";
import { PLAN_CONFIGS, PLAN_ORDER } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe/client";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/stripe/checkout";

export const runtime = "nodejs";

const upgradeBodySchema = z.object({
  plan: z.enum(["free", "pro", "business"] as const),
  action: z.enum(["upgrade", "portal"]).optional().default("upgrade")
});

export async function GET(request: NextRequest) {
  try {
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const workspaceId = account.activeWorkspace.id;
    const { subscription, usage } = await getSubscriptionWithUsage(workspaceId);
    const stripeEnabled = isStripeConfigured();
    const response = NextResponse.json({
      subscription,
      usage,
      stripeEnabled,
      plans: PLAN_ORDER.map((plan) => PLAN_CONFIGS[plan])
    });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error, "GET /api/billing");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, cookiesToSet } = await authenticateRequest(request);
    const account = await ensureAccountForUser(user);
    const workspaceId = account.activeWorkspace.id;
    const body = await request.json().catch(() => ({}));
    const parsed = upgradeBodySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body.", "invalid_body", parsed.error.flatten());
    }

    const { plan, action } = parsed.data;

    if (action === "portal") {
      const { subscription } = await getSubscriptionWithUsage(workspaceId);

      if (!subscription.stripe_customer_id) {
        throw new ApiError(400, "No Stripe customer on file. Start a checkout to set up billing first.", "no_stripe_customer");
      }

      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const portalUrl = await createBillingPortalSession({
        stripeCustomerId: subscription.stripe_customer_id,
        returnUrl: `${appUrl}/app/billing`
      });

      if (!portalUrl) {
        throw new ApiError(500, "Could not create billing portal session.", "portal_error");
      }

      const response = NextResponse.json({ redirectUrl: portalUrl });

      return applyAuthCookies(response, cookiesToSet);
    }

    if (plan === "free") {
      throw new ApiError(400, "Downgrade to free is not supported through this endpoint.", "downgrade_not_supported");
    }

    if (isStripeConfigured()) {
      const { subscription } = await getSubscriptionWithUsage(workspaceId);
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const result = await createCheckoutSession({
        workspaceId,
        userEmail: account.user.email,
        plan: plan as SubscriptionPlan,
        successUrl: `${appUrl}/app/billing?upgraded=1`,
        cancelUrl: `${appUrl}/app/billing?canceled=1`,
        existingStripeCustomerId: subscription.stripe_customer_id
      });

      if (result.type === "error") {
        throw new ApiError(500, result.message, "checkout_error");
      }

      const response = NextResponse.json({ redirectUrl: result.url });

      return applyAuthCookies(response, cookiesToSet);
    }

    const updated = await upgradeSubscriptionMock(workspaceId, plan as SubscriptionPlan);
    const response = NextResponse.json({ subscription: updated, mock: true });

    return applyAuthCookies(response, cookiesToSet);
  } catch (error) {
    return apiErrorResponse(error, "POST /api/billing");
  }
}
