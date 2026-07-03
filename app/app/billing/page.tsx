import { redirect } from "next/navigation";
import { fetchInternalApi } from "@/lib/api/server-fetch";
import type { SubscriptionRecord, WorkspaceUsage } from "@/lib/db/subscriptions";
import type { PlanConfig } from "@/lib/plans";
import { BillingClient } from "./BillingClient";

type BillingApiResponse = {
  subscription: SubscriptionRecord;
  usage: WorkspaceUsage;
  plans: PlanConfig[];
  stripeEnabled: boolean;
};

function noticeFromParams(params: Record<string, string | string[] | undefined>): string | null {
  if (params.upgraded === "1") {
    return "Your plan has been upgraded. Welcome to your new plan!";
  }

  if (params.canceled === "1") {
    return null;
  }

  return null;
}

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, result] = await Promise.all([searchParams, fetchInternalApi<BillingApiResponse>("/api/billing")]);

  if (!result.ok) {
    if (result.status === 401) {
      redirect("/login?next=/app/billing");
    }

    throw new Error(result.error.message);
  }

  const { subscription, usage, plans, stripeEnabled } = result.data;
  const notice = noticeFromParams(params);

  return (
    <BillingClient
      subscription={subscription}
      usage={usage}
      plans={plans}
      stripeEnabled={stripeEnabled}
      initialNotice={notice}
    />
  );
}
