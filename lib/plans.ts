import type { SubscriptionPlan } from "@/lib/db/database.types";

export type PlanConfig = {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  botLimit: number;
  documentLimit: number;
  monthlyMessageLimit: number;
  removesBranding: boolean;
  customTheme: boolean;
  stripePriceIdEnvVar: string;
  features: string[];
};

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    plan: "free",
    name: "Free",
    price: "$0",
    description: "Validate one bot with a small knowledge base.",
    botLimit: 1,
    documentLimit: 5,
    monthlyMessageLimit: 100,
    removesBranding: false,
    customTheme: false,
    stripePriceIdEnvVar: "",
    features: ["1 bot", "5 documents", "100 monthly messages", "HelpDock branding on widget"]
  },
  pro: {
    plan: "pro",
    name: "Pro",
    price: "$29",
    description: "Launch polished support widgets for growing teams.",
    botLimit: 10,
    documentLimit: 100,
    monthlyMessageLimit: 2000,
    removesBranding: true,
    customTheme: true,
    stripePriceIdEnvVar: "STRIPE_PRO_PRICE_ID",
    features: ["10 bots", "100 documents", "2,000 monthly messages", "Remove widget branding", "Custom widget theme"]
  },
  business: {
    plan: "business",
    name: "Business",
    price: "$99",
    description: "Scale support across more bots with team-ready controls.",
    botLimit: 30,
    documentLimit: 500,
    monthlyMessageLimit: 10000,
    removesBranding: true,
    customTheme: true,
    stripePriceIdEnvVar: "STRIPE_BUSINESS_PRICE_ID",
    features: [
      "30 bots",
      "500 documents",
      "10,000 monthly messages",
      "Remove widget branding",
      "Custom widget theme",
      "Priority ingestion",
      "Advanced analytics"
    ]
  }
};

export const PLAN_ORDER: SubscriptionPlan[] = ["free", "pro", "business"];

export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function isUpgrade(from: SubscriptionPlan, to: SubscriptionPlan): boolean {
  return PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);
}

export function planAllowsCustomTheme(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIGS[plan].customTheme;
}

export function planRemovesBranding(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIGS[plan].removesBranding;
}
