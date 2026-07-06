import type { Metadata } from "next";
import { Check, Eye, Paintbrush, Power, ShieldCheck } from "lucide-react";
import {
  FinalCta,
  HeroActions,
  LandingHeader,
  PricingSection,
  PRODUCT_NAME,
  WidgetScene,
  WorkflowBand
} from "@/app/landing/_components/landing-sections";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | Landing concept 2`,
  description: "A widget-led landing page concept for AskDoc."
};

export default function LandingTwoPage() {
  const controls = [
    ["Turn the widget on or off", "Disable public chat instantly without removing the script tag.", Power],
    ["Match customer-facing branding", "Paid plans can set widget color, position, avatar initials, and welcome copy.", Paintbrush],
    ["Choose source visibility", "Mention source files for internal teams or keep customer answers clean.", Eye],
    ["Keep answers grounded", "Source chunks stay visible inside the app while teams test and improve coverage.", ShieldCheck]
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingHeader active="product" />

      <section className="relative overflow-hidden border-y bg-[#fff9ec]">
        <div className="absolute left-1/2 top-[455px] w-[1110px] -translate-x-1/2">
          <WidgetScene />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[690px] pt-16">
          <p className="text-sm font-semibold text-primary">Website support widget</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
            {PRODUCT_NAME} brings your help docs into every customer page.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Give visitors a focused AI assistant trained on the files your team already trusts, with setup and testing
            handled from one product workspace.
          </p>
          <div className="mt-8">
            <HeroActions secondaryHref="/app/bots" />
          </div>
        </div>
      </section>

      <section id="product" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">Widget controls</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
                A public chat surface that still feels manageable.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              This concept leads with the customer-facing widget and makes the app feel like the control room behind it.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {controls.map(([title, copy, Icon]) => (
              <div key={title} className="rounded-lg border bg-background p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-accent">Launch confidence</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Test the bot where your team works, then embed it where customers ask.</h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              The app keeps private evaluation separate from the public widget. That makes the demo feel like a real SaaS
              product instead of a one-off chat page.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Ask questions in the in-app chat before publishing.",
              "Review source snippets under each answer during testing.",
              "Upgrade to customize styling and remove AskDoc branding.",
              "Use one snippet to add the widget to a separate website."
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <Check className="size-4 shrink-0 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <WorkflowBand title="The widget is only the last step of a controlled workflow" />
      <PricingSection headline="Simple limits make the upgrade moment obvious" />
      <FinalCta copy="Create a bot, publish a widget preview, then upgrade only when your demo needs more bots, documents, or styling." />
    </main>
  );
}
