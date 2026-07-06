import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, FileStack, MessageCircleQuestion, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FeatureGrid,
  FinalCta,
  LandingHeader,
  LaunchScene,
  PricingSection,
  PRODUCT_NAME,
  SIGNUP_HREF
} from "@/app/landing/_components/landing-sections";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | Landing concept 3`,
  description: "A workflow-led landing page concept for HelpDock AI."
};

export default function LandingThreePage() {
  const launchSteps = [
    ["Collect knowledge", "Upload docs, policies, spreadsheets, and FAQ files into a single bot project.", FileStack],
    ["Review answers", "Ask the questions customers already ask and inspect the source context below replies.", MessageCircleQuestion],
    ["Set the widget", "Choose welcome copy, position, color, availability, and source reference behavior.", ClipboardCheck],
    ["Launch support", "Install one script on the website and keep improvements inside the HelpDock workspace.", Rocket]
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingHeader active="workflow" />

      <section className="relative overflow-hidden border-y bg-[#edf6f8]">
        <div className="absolute left-1/2 top-[465px] w-[1120px] -translate-x-1/2">
          <LaunchScene />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[685px] pt-16">
          <p className="text-sm font-semibold text-primary">Guided launch path</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
            {PRODUCT_NAME} is a launch checklist for your first AI support bot.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Move from scattered company knowledge to a tested, embeddable chatbot with limits, billing, and onboarding
            already shaped like a real SaaS product.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href={SIGNUP_HREF}>
                Follow the setup flow
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app/billing">View plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Onboarding</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">A logical path from signup to embedded support.</h2>
            <p className="mt-4 text-muted-foreground">
              This version is built for buyers who need to understand the product journey quickly before creating an
              account.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {launchSteps.map(([title, copy, Icon], index) => (
              <div key={title} className="rounded-lg border bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="border-y bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-accent">MVP scope</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Focused enough to demo, complete enough to believe.</h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              HelpDock AI keeps the product surface tight: bot setup, knowledge ingestion, chat testing, widget install,
              and pricing gates. Each feature supports the same launch story.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["Free plan", "1 bot, 5 documents, and 100 monthly messages for evaluation."],
              ["Pro upgrade", "More bots, more documents, custom widget theme, and branding removal."],
              ["Business path", "Higher limits for teams with multiple support surfaces."]
            ].map(([title, copy]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-white/65">{copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeatureGrid variant="compact" />
      <PricingSection headline="Plans aligned to the onboarding story" />
      <FinalCta copy="Start with the free checklist, prove that the bot answers from your knowledge, then use Pro styling when it is ready for real customers." />
    </main>
  );
}
