import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileText, MessageSquare, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MainDashboardScene,
  MainFeatureGrid,
  MainFinalCta,
  MainHeroActions,
  MainLandingHeader,
  MainPricingSection,
  MainUseCaseSection,
  MainWorkflowBand,
  PRODUCT_NAME,
  SIGNUP_HREF
} from "@/app/_components/main-landing-sections";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | Company knowledge bot builder`,
  description: "Turn company docs into grounded AI assistants for customers, employees, partners, and website visitors."
};

export default function HomePage() {
  const productHighlights = [
    ["Knowledge upload", "Drag in policies, product docs, playbooks, decks, and CSVs with visible ingestion states.", FileText],
    ["Private answer testing", "Ask real team, prospect, and customer questions in a ChatGPT-like workspace before launch.", MessageSquare],
    ["One-line embed", "Copy the script tag, control availability, and publish the same bot to any website.", PlugZap]
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainLandingHeader active="product" />

      <section className="relative overflow-hidden border-y bg-[#eef7f4]">
        <div className="absolute inset-x-6 top-[500px] mx-auto hidden max-w-[1080px] md:block">
          <MainDashboardScene />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-12 pt-12 md:pb-[690px] md:pt-16">
          <p className="text-sm font-semibold text-primary">Company knowledge bot builder</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-5xl">
            {PRODUCT_NAME} turns company knowledge into AI assistants for customers and teams.
          </h1>
          <div className="mt-5 flex max-w-4xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              Upload policies, FAQs, product docs, playbooks, and spreadsheets. Test grounded answers in the app, then
              publish the same bot as a branded website widget.
            </p>
            <MainHeroActions />
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
            {["Customer support", "Internal knowledge", "Sales enablement", "1 script tag to embed"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1.5">
                <Check className="size-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10 rounded-lg border bg-white shadow-2xl shadow-slate-900/10 md:hidden">
            <div className="flex h-10 items-center gap-2 border-b bg-slate-50 px-4">
              <span className="size-3 rounded-full bg-rose-400" />
              <span className="size-3 rounded-full bg-amber-400" />
              <span className="size-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[11px] text-slate-400">askdoc.ai/app</span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Acme Knowledge</p>
                  <p className="text-xs text-slate-500">Partner + team bot</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Live</span>
              </div>
              <div className="ml-auto max-w-[86%] rounded-lg rounded-br-sm bg-slate-900 px-3 py-2 text-sm text-white">
                Can I publish this on our docs site?
              </div>
              <div className="max-w-[92%] rounded-lg rounded-bl-sm border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Yes. Use the widget snippet, then keep improving answers from the same private testing workspace.
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {["team-handbook.pdf", "product-docs.md"].map((source) => (
                  <span key={source} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <MainProofStrip /> */}

      <section id="product" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Why it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">One tested bot, multiple knowledge surfaces.</h2>
            <p className="mt-4 text-muted-foreground">
              Teams can validate answers privately, check source chunks, tune the fallback message, and then choose where
              the bot belongs: a public website, customer portal, docs page, or internal workspace.
            </p>
            <Button className="mt-7" variant="outline" asChild>
              <Link href={SIGNUP_HREF}>
                Try the dashboard flow
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {productHighlights.map(([title, copy, Icon]) => (
              <div key={title} className="rounded-lg border bg-background p-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MainUseCaseSection />
      <MainWorkflowBand />
      <MainFeatureGrid variant="compact" />
      <MainPricingSection />
      <MainFinalCta />
    </main>
  );
}
