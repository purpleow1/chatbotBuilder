"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ExternalLink, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanConfig } from "@/lib/plans";
import type { SubscriptionRecord, WorkspaceUsage } from "@/lib/db/subscriptions";
import type { SubscriptionPlan } from "@/lib/db/database.types";

type Props = {
  subscription: SubscriptionRecord;
  usage: WorkspaceUsage;
  plans: PlanConfig[];
  stripeEnabled: boolean;
  initialNotice?: string | null;
};

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? "font-medium text-destructive" : isNearLimit ? "font-medium text-amber-600" : "text-muted-foreground"}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PlanBadge({ plan, currentPlan }: { plan: SubscriptionPlan; currentPlan: SubscriptionPlan }) {
  if (plan === currentPlan) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Current plan
      </span>
    );
  }

  return null;
}

export function BillingClient({ subscription, usage, plans, stripeEnabled, initialNotice }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);

  async function handleUpgrade(plan: SubscriptionPlan) {
    setLoadingPlan(plan);
    setError(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, action: "upgrade" })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Upgrade failed. Please try again.");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;

        return;
      }

      if (data.mock) {
        setNotice(`Switched to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (mock billing).`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    setLoadingPlan("pro");
    setError(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: subscription.plan, action: "portal" })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Could not open billing portal.");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = subscription.plan;
  const planOrder: SubscriptionPlan[] = ["free", "pro", "business"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const isMockBilling = subscription.billing_provider === "mock";
  const canManageStripe = !isMockBilling && stripeEnabled && !!subscription.stripe_customer_id;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight">Plans and usage</h1>
        <p className="mt-2 text-muted-foreground">
          {stripeEnabled ? "Manage your plan and view usage for this workspace." : "Mock billing is active. Set Stripe keys to enable real payments."}
        </p>
      </div>

      {notice && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {plans.find((p) => p.plan === currentPlan)?.name ?? "Free"} plan
                {isMockBilling && <span className="ml-2 text-xs font-normal text-muted-foreground">(mock)</span>}
              </CardTitle>
              <CardDescription className="mt-0.5">
                Billing period: {new Date(subscription.current_period_start).toLocaleDateString()} –{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </CardDescription>
            </div>
            {canManageStripe && (
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={loadingPlan !== null}>
                {loadingPlan === "pro" ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                Manage billing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar used={usage.botCount} limit={subscription.bot_limit} label="Bots" />
          <UsageBar used={usage.documentCount} limit={subscription.document_limit} label="Documents" />
          <UsageBar used={usage.monthlyMessageCount} limit={subscription.monthly_message_limit} label="Monthly messages" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.plan === currentPlan;
          const isUpgradePlan = planOrder.indexOf(plan.plan) > currentPlanIndex;
          const isLoading = loadingPlan === plan.plan;
          const isPro = plan.plan === "pro";

          return (
            <Card key={plan.plan} className={isPro ? "border-primary shadow-sm" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <PlanBadge plan={plan.plan} currentPlan={currentPlan} />
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-3">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      <Check className="size-4" />
                      Current plan
                    </Button>
                  ) : isUpgradePlan ? (
                    <Button className="w-full" onClick={() => handleUpgrade(plan.plan)} disabled={loadingPlan !== null}>
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Zap className="size-4" />
                      )}
                      {stripeEnabled ? "Upgrade with Stripe" : "Switch to this plan"}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade
                    </Button>
                  )}
                </div>

                {isUpgradePlan && !stripeEnabled && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Mock billing — no payment required
                  </p>
                )}

                {isUpgradePlan && stripeEnabled && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Secured by Stripe
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!stripeEnabled && (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 p-4">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Enable real payments</p>
              <p className="mt-1">
                Add <code className="rounded bg-muted px-1 py-0.5 text-xs">STRIPE_SECRET_KEY</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">STRIPE_PUBLISHABLE_KEY</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">STRIPE_WEBHOOK_SECRET</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">STRIPE_PRO_PRICE_ID</code>, and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">STRIPE_BUSINESS_PRICE_ID</code> to your environment to
                activate Stripe checkout.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
