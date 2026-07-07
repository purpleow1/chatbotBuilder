import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BotMessageSquare,
  Check,
  ChevronRight,
  Code2,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Paintbrush,
  PlugZap,
  SearchCheck,
  ShieldCheck,
  Zap
} from "lucide-react";
import { HeroChatAnimationFrame } from "@/app/_components/hero-chat-animation-frame";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIGS, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const PRODUCT_NAME = "AskDoc";
export const LOGO_SRC = "/logos/askdoc-logo.svg";
export const SIGNUP_HREF = "/signup?next=%2Fapp%2Fbots%2Fnew";
export const LOGIN_HREF = "/login?next=%2Fapp";

type MainLandingHeaderProps = {
  className?: string;
};

export function MainLandingHeader({ className }: MainLandingHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/app" className="inline-flex items-center text-foreground">
          <Image src={LOGO_SRC} alt={`${PRODUCT_NAME} logo`} width={140} height={40} priority className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden md:inline-flex">
            <Link href={LOGIN_HREF}>Log in</Link>
          </Button>
          <Button asChild>
            <Link href={SIGNUP_HREF}>
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MainHeroActions() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button size="lg" asChild>
        <Link href={SIGNUP_HREF}>
          Create your first bot
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export function MainDashboardScene({ className }: { className?: string }) {
  const deliveryUpdateSources = ["shipping-policy.md", "order-changes-faq.md"];
  const deliveryConfirmationSources = ["delivery-playbook.pdf"];
  const steps = ["Create bot", "Upload docs", "Test answers", "Publish widget"];
  const widgetSettings = [
    ["Tone", "Friendly"],
    ["Fallback", "Contact CTA"],
    ["Sources", "3 files"],
    ["Theme", "Sky"]
  ] as const;

  return (
    <HeroChatAnimationFrame
      className={cn("relative overflow-hidden rounded-lg border bg-white shadow-2xl shadow-slate-900/12", className)}
    >
      <div className="flex h-10 items-center gap-2 border-b bg-slate-50 px-4">
        <span className="size-3 rounded-full bg-rose-400" />
        <span className="size-3 rounded-full bg-amber-400" />
        <span className="size-3 rounded-full bg-emerald-500" />
        <span className="ml-3 h-5 w-56 rounded bg-white px-3 text-[11px] leading-5 text-slate-400">
          app.askdoc.ai/bots
        </span>
      </div>
      <div className="grid h-[480px] grid-cols-[150px_minmax(0,1fr)_210px] bg-slate-100 lg:grid-cols-[170px_minmax(0,1fr)_250px] xl:grid-cols-[190px_minmax(0,1fr)_270px]">
        <aside className="border-r bg-white p-3 lg:p-4">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="size-4" />
            </span>
            <p className="text-sm font-semibold">Launch checklist</p>
          </div>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-xs lg:px-3 lg:text-sm",
                  index === 2 ? "bg-slate-200 text-slate-800" : "text-slate-600"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                    index === 2 ? "bg-white text-slate-600" : "bg-slate-100"
                  )}
                >
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 p-4 lg:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Private test chat</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="hero-chat-message hero-chat-delay-1 ml-auto max-w-[78%] rounded-lg rounded-br-sm bg-slate-700 px-4 py-3 text-sm text-white">
              Can I update the delivery address before my order ships?
            </div>
            <div className="hero-chat-message hero-chat-delay-2 max-w-[86%] rounded-lg rounded-bl-sm border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Yes. Use the change link in your order email before the shipping label is created.
              <div className="mt-3 flex flex-wrap gap-2">
                {deliveryUpdateSources.map((source) => (
                  <span key={source} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {source}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero-chat-message hero-chat-delay-3 ml-auto max-w-[78%] rounded-lg rounded-br-sm bg-slate-700 px-4 py-3 text-sm text-white">
              How do I know it saved?
            </div>
            <div className="hero-chat-message hero-chat-delay-4 max-w-[88%] rounded-lg rounded-bl-sm border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              The order page will show the new city and delivery window. You will also get an updated shipping email.
              <div className="mt-3 flex flex-wrap gap-2">
                {deliveryConfirmationSources.map((source) => (
                  <span key={source} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="border-l bg-white p-3 lg:p-4">
          <div className="flex h-full flex-col rounded-lg border bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="whitespace-nowrap text-sm font-semibold">Widget settings</p>
                <p className="text-xs text-slate-500">External site</p>
              </div>
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-emerald-500" />
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {widgetSettings.map(([label, value]) => (
                <div key={label} className="rounded-md border bg-white px-2 pb-1.5 pt-1">
                  <span className="text-[9px] font-semibold uppercase text-slate-400">{label}</span>
                  <p className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-600">Live site preview</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Enabled
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-white p-2.5 shadow-sm">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md bg-sky-100 text-[11px] font-semibold text-sky-700">
                    AD
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">AskDoc bot</p>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                  <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-slate-600 shadow-sm">
                    Hi, I can answer product, policy, and onboarding questions.
                  </p>
                  <div className="flex-1" />
                  <div className="mt-3 h-8 rounded-md border bg-white px-3 text-xs leading-8 text-slate-400">
                    Ask a question...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </HeroChatAnimationFrame>
  );
}

export function MainHowItWorksSection() {
  const steps = [
    ["Create the assistant", "Choose the audience, purpose, tone, and fallback behavior.", BotMessageSquare],
    ["Upload trusted knowledge", "Add the docs, guides, policies, and playbooks it should answer from.", FileText],
    ["Test real questions", "Check answers privately and review the sources behind them.", MessageSquare],
    ["Publish where it belongs", "Enable the widget, copy the embed code, and keep improving it.", Code2]
  ] as const;

  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Build once. Test privately. Publish anywhere.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Turn trusted company materials into assistants your customers, employees, and partners can use wherever
              questions happen: on your site, in customer portals, or inside team workflows.
            </p>
          </div>
          <Button variant="outline" asChild className="w-fit">
            <Link href={SIGNUP_HREF}>
              Start setup
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {steps.map(([step, copy, Icon], index) => (
            <div key={step} className="rounded-lg border bg-background p-4 xl:p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 text-sm font-semibold text-muted-foreground">0{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MainWorkflowBand({ title = "From docs to live widget in four steps" }: { title?: string }) {
  const steps = [
    ["Create", "Name the bot, define its audience, fallback copy, and widget basics.", BotMessageSquare],
    ["Upload", "Add PDF, DOCX, markdown, text, and CSV knowledge sources.", FileText],
    ["Test", "Ask real customer, team, and partner questions while reviewing source chunks.", MessageSquare],
    ["Embed", "Copy one script tag and control availability from the app.", Code2]
  ] as const;

  return (
    <section id="workflow" className="border-y bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="text-sm font-semibold text-primary">Workflow</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">{title}</h2>
          </div>
          <Button variant="outline" asChild className="hidden md:inline-flex">
            <Link href={SIGNUP_HREF}>
              Start setup
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([step, copy, Icon], index) => (
            <div key={step} className="rounded-lg border bg-background p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 text-sm font-semibold text-muted-foreground">0{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MainUseCaseSection() {
  const useCases = [
    ["Customer support", "Answer repetitive FAQs, refunds, setup, troubleshooting, and policy questions from approved docs.", MessageSquare],
    ["Website conversion", "Help visitors understand your product, compare plans, and get answers before they book a demo or contact support.", Handshake],
    ["Internal knowledge", "Give your team one place to ask about policies, tools, processes, and how work gets done.", BookOpen]
  ] as const;

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent">Use cases</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
            Put your knowledge where the questions happen
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
            AskDoc turns your trusted docs into assistants for customers, website visitors, and internal teams.
          </p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {useCases.map(([title, copy, Icon]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MainFeatureGrid({ variant = "default" }: { variant?: "default" | "compact" }) {
  const features = [
    ["Source-backed answers", "Test responses against uploaded files and review the sources behind important claims.", SearchCheck],
    ["Private answer testing", "Ask real customer, employee, and partner questions before anyone outside the team sees the bot.", MessageSquare],
    ["Fallback message control", "Set what the assistant should say when the uploaded knowledge does not contain a confident answer.", ShieldCheck],
    ["Widget theme and placement", "Match the embedded chat to your site with welcome copy, colors, positioning, and branding controls.", Paintbrush],
    ["Availability controls", "Turn the widget on when it is ready, pause it when needed, and keep testing in the app.", PlugZap],
    ["Plan limits that are clear upfront", "See bot, document, message, and theme limits before you hit them, with upgrade paths in context.", Zap]
  ] as const;

  return (
    <section id="controls" className={cn("bg-background", variant === "compact" ? "py-14" : "py-16")}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Controls</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Stay in control before the bot goes live</h2>
          <p className="mt-4 text-muted-foreground">
            Tune the assistant, check its sources, manage the widget, and understand plan limits before customers or
            teammates rely on it.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(([title, copy, Icon]) => (
            <div key={title} className="rounded-lg border bg-white p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-md bg-accent/20 text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MainPricingSection({ headline = "Pricing that fits a launch path" }: { headline?: string }) {
  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Pricing</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">{headline}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Start free with one bot and 20 documents. Upgrade when you need more knowledge sources, more widgets, custom
            styling, and higher message volume.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIGS[plan];
            const highlighted = plan === "pro";
            const features =
              plan === "free"
                ? ["1 bot", "20 documents", "200 monthly messages", "AskDoc branding on widget"]
                : config.features.filter((feature) => feature !== "Priority ingestion");

            return (
              <div
                key={plan}
                className={cn(
                  "rounded-lg border bg-background p-6",
                  highlighted && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold">{config.name}</h3>
                    {highlighted ? (
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Popular</span>
                    ) : null}
                  </div>
                  <p className={cn("mt-2 text-sm", highlighted ? "text-primary-foreground/75" : "text-muted-foreground")}>
                    {config.description}
                  </p>
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold">{config.price}</span>
                  <span className={cn("pb-1 text-sm", highlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    /mo
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-accent" : "text-primary")} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-7 w-full" variant={highlighted ? "secondary" : "outline"} asChild>
                  <Link href={SIGNUP_HREF}>{plan === "free" ? "Start free" : "Upgrade plan"}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MainFinalCta({ copy = "Upload 20 docs, test one bot, and see the widget before you think about a paid plan." }) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-6 py-14 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-accent">Ready when your docs are</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
            Build an assistant your team can trust.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">{copy}</p>
        </div>
        <Button size="lg" asChild>
          <Link href={SIGNUP_HREF}>
            Start free
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function MainProofStrip() {
  const metrics = [
    ["5", "document types supported"],
    ["1", "script tag to embed"],
    ["100", "free monthly messages"],
    ["2k", "Pro monthly messages"]
  ];

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-6 px-6 py-8">
        {metrics.map(([value, label]) => (
          <div key={label}>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-white/65">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
