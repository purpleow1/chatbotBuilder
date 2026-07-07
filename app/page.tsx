import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, PlugZap } from "lucide-react";
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
  title: `${PRODUCT_NAME} | AI assistants from company knowledge`,
  description: "Turn company docs into grounded AI assistants for customers, employees, partners, and website visitors."
};

export default function HomePage() {
  const productHighlights = [
    ["Knowledge upload", "Drag in policies, product docs, playbooks, decks, and CSVs with visible ingestion states.", FileText],
    ["Private answer testing", "Ask real team, prospect, and customer questions in a private testing workspace before launch.", MessageSquare],
    ["One-line embed", "Copy the script tag, control availability, and publish the same bot to any website.", PlugZap]
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainLandingHeader active="product" />

      <section className="relative overflow-hidden border-y bg-[#eef7f4]">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#dff2eb_0%,#eef7f4_68%,rgba(238,247,244,0)_100%)]" />
        <div className="absolute inset-x-6 top-[470px] mx-auto hidden max-w-[1080px] md:block">
          <MainDashboardScene />
        </div>
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-12 pt-16 text-center md:pb-[700px] md:pt-24">
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Build AI assistants from your company knowledge
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
            Upload docs, guides, policies, and playbooks, then publish helpful assistants for customers, teams, and
            workflows.
          </p>
          <div className="mt-8">
            <MainHeroActions />
          </div>
          <div className="mt-14 rounded-lg border bg-white shadow-2xl shadow-slate-900/10 md:hidden">
            <div className="flex h-10 items-center gap-2 border-b bg-slate-50 px-4">
              <span className="size-3 rounded-full bg-rose-400" />
              <span className="size-3 rounded-full bg-amber-400" />
              <span className="size-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[11px] text-slate-400">app.askdoc.ai/bots</span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">AskDoc Demo</p>
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
            <p className="text-sm font-semibold text-primary">Product loop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Build once. Publish wherever questions happen.</h2>
            <p className="mt-4 text-muted-foreground">
              Create one trusted knowledge assistant, test its answers privately, then publish it to a website, docs page,
              customer portal, or internal team workspace.
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

      <MainWorkflowBand />
      <MainUseCaseSection />
      <MainFeatureGrid variant="compact" />
      <MainPricingSection />
      <MainFinalCta />
    </main>
  );
}
