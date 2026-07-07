import type { Metadata } from "next";
import {
  MainDashboardScene,
  MainFeatureGrid,
  MainFinalCta,
  MainHeroActions,
  MainHowItWorksSection,
  MainLandingHeader,
  MainPricingSection,
  MainUseCaseSection,
  PRODUCT_NAME,
} from "@/app/_components/main-landing-sections";

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | AI assistants from company knowledge`,
  description: "Turn company docs into grounded AI assistants for customers, employees, partners, and website visitors."
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainLandingHeader />

      <section className="relative overflow-hidden border-y bg-[#eef7f4]">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#dff2eb_0%,#eef7f4_68%,rgba(238,247,244,0)_100%)]" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-12 pt-16 text-center md:min-h-[calc(100svh-82px)] md:justify-center md:pb-32 md:pt-20">
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
            <div className="space-y-3 p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">AskDoc</p>
                  <p className="text-xs text-slate-500">Support bot</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Widget enabled
                </span>
              </div>
              <div className="ml-auto max-w-[86%] rounded-lg rounded-br-sm bg-slate-900 px-3 py-2 text-sm text-white">
                Can I update the delivery address before my order ships?
              </div>
              <div className="max-w-[92%] rounded-lg rounded-bl-sm border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Yes. Use the change link in your order email before the shipping label is created.
                <div className="mt-3 flex flex-wrap gap-2">
                  {["shipping-policy.md", "order-changes-faq.md"].map((source) => (
                    <span key={source} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-auto max-w-[72%] rounded-lg rounded-br-sm bg-slate-900 px-3 py-2 text-sm text-white">
                How do I know it saved?
              </div>
              <div className="max-w-[92%] rounded-lg rounded-bl-sm border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                The order page will show the new city and delivery window. You will also get an updated shipping email.
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    delivery-playbook.pdf
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto -mt-20 hidden max-w-[1080px] px-6 pb-20 md:block">
          <MainDashboardScene />
        </div>
      </section>

      {/* <MainProofStrip /> */}

      <MainHowItWorksSection />

      <MainUseCaseSection />
      <MainFeatureGrid variant="compact" />
      <MainPricingSection />
      <MainFinalCta />
    </main>
  );
}
