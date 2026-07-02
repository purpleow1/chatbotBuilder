import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Validate one bot with a small knowledge base.",
    features: ["1 bot", "5 documents", "100 monthly messages", "HelpDock branding"]
  },
  {
    name: "Pro",
    price: "$29",
    description: "Launch polished support widgets for growing teams.",
    features: ["3 bots", "100 documents", "2,000 monthly messages", "Custom widget theme"]
  },
  {
    name: "Business",
    price: "$99",
    description: "Demo-scale advanced limits and team-ready controls.",
    features: ["Unlimited demo bots", "Advanced analytics", "Priority ingestion", "Remove branding"]
  }
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight">Plans and usage</h1>
        <p className="mt-2 text-muted-foreground">Stripe test checkout or mock billing will be connected in Step 10.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Current plan: Free</p>
            <p className="mt-1 text-sm text-muted-foreground">42 of 100 monthly messages used.</p>
          </div>
          <Button>
            <CreditCard className="size-4" />
            Manage billing
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name === "Pro" ? "border-primary shadow-sm" : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
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
                    <Check className="size-4 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button className="mt-5 w-full" variant={plan.name === "Free" ? "outline" : "default"}>
                {plan.name === "Free" ? "Current plan" : "Choose plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
