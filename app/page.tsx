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
  MainWorkflowBand,
  PRODUCT_NAME,
  SIGNUP_HREF
} from "@/app/_components/main-landing-sections";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | Embeddable chatbot builder`,
  description: "Turn company docs into a grounded AI support chatbot and embeddable website widget."
};

export default function HomePage() {
  const productHighlights = [
    ["Knowledge upload", "Drag in company documents and track ready, processing, or failed ingestion states.", FileText],
    ["Grounded answer testing", "Ask real support questions in a ChatGPT-like workspace before launch.", MessageSquare],
    ["One-line embed", "Copy the script tag, control availability, and update widget settings from the app.", PlugZap]
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainLandingHeader active="product" />

      <section className="relative overflow-hidden border-y bg-[#eef7f4]">
        <div className="absolute left-1/2 top-[500px] w-[1080px] -translate-x-1/2">
          <MainDashboardScene />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[690px] pt-16">
          <p className="text-sm font-semibold text-primary">Embeddable chatbot builder</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
            {PRODUCT_NAME} turns company docs into a support chatbot customers can trust.
          </h1>
          <div className="mt-5 flex max-w-4xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              Upload policies, FAQs, docs, and CSVs. Test grounded answers in the app, then publish the same assistant as a
              branded website widget.
            </p>
            <MainHeroActions />
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
            {["Free plan included", "PDF, DOCX, MD, TXT, CSV", "Source-aware testing", "1 script tag to embed"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1.5">
                <Check className="size-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* <MainProofStrip /> */}

      <section id="product" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Why it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">The app and the widget use the same tested bot.</h2>
            <p className="mt-4 text-muted-foreground">
              Teams can validate answers privately, check source chunks, tune the fallback message, and only then expose
              the assistant on a public website.
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
      <MainFeatureGrid variant="compact" />
      <MainPricingSection />
      <MainFinalCta />
    </main>
  );
}
