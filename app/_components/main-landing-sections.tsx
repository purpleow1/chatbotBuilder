import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BotMessageSquare,
  Briefcase,
  Check,
  ChevronRight,
  Code2,
  FileText,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Paintbrush,
  PlugZap,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIGS, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const PRODUCT_NAME = "AskDoc";
export const LOGO_SRC = "/logos/askdoc-logo.svg";
export const SIGNUP_HREF = "/signup?next=%2Fapp%2Fbots%2Fnew";
export const LOGIN_HREF = "/login?next=%2Fapp";

type MainLandingHeaderProps = {
  active?: "product" | "workflow";
  className?: string;
};

export function MainLandingHeader({ active, className }: MainLandingHeaderProps) {
  const links = [
    ["Product", "#product", "product"],
    ["How it works", "#workflow", "workflow"],
    ["Pricing", "#pricing", "pricing"]
  ] as const;

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/app" className="inline-flex items-center text-foreground">
          <Image src={LOGO_SRC} alt={`${PRODUCT_NAME} logo`} width={140} height={40} priority className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href, key]) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active === key && "bg-muted text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
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
    <div className="flex flex-wrap items-center gap-3">
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
  const sources = ["team-handbook.pdf", "partner-playbook.csv", "product-docs.md"];
  const steps = ["Create bot", "Upload docs", "Test answer", "Publish widget"];

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-white shadow-2xl shadow-slate-900/12", className)}>
      <div className="flex h-10 items-center gap-2 border-b bg-slate-50 px-4">
        <span className="size-3 rounded-full bg-rose-400" />
        <span className="size-3 rounded-full bg-amber-400" />
        <span className="size-3 rounded-full bg-emerald-500" />
        <span className="ml-3 h-5 w-56 rounded bg-white text-[11px] leading-5 text-slate-400">app.askdoc.ai/app/bots/acme</span>
      </div>
      <div className="grid h-[480px] grid-cols-[150px_minmax(0,1fr)_210px] bg-slate-100 lg:grid-cols-[170px_minmax(0,1fr)_250px] xl:grid-cols-[190px_minmax(0,1fr)_270px]">
        <aside className="border-r bg-white p-3 lg:p-4">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Acme Knowledge</p>
              <p className="text-xs text-slate-500">Pro workspace</p>
            </div>
          </div>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-xs lg:px-3 lg:text-sm",
                  index === 2 ? "bg-primary text-primary-foreground" : "text-slate-600"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                    index === 2 ? "bg-white/20" : "bg-slate-100"
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
              <p className="text-sm font-semibold">Answer testing</p>
              <p className="text-xs text-slate-500">Grounded by uploaded company knowledge</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Widget enabled</span>
          </div>
          <div className="space-y-3">
            <div className="ml-auto max-w-[78%] rounded-lg rounded-br-sm bg-slate-900 px-4 py-3 text-sm text-white">
              What should new partners know before launch?
            </div>
            <div className="max-w-[86%] rounded-lg rounded-bl-sm border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Share the reseller checklist, current positioning, support escalation path, and the approved pricing notes.
              The answer is grounded in the partner playbook and product docs.
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map((source) => (
                  <span key={source} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {source}
                  </span>
                ))}
              </div>
            </div>
            <div className="ml-auto max-w-[78%] rounded-lg rounded-br-sm bg-slate-900 px-4 py-3 text-sm text-white">
              Can I publish this bot on our docs site?
            </div>
            <div className="max-w-[88%] rounded-lg rounded-bl-sm border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Yes. Copy the widget snippet from bot settings, choose the welcome message and theme, then keep improving
              answers from the same private testing workspace.
            </div>
          </div>
        </section>

        <aside className="border-l bg-white p-3 lg:p-4">
          <div className="rounded-lg border bg-slate-50 p-3 lg:p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">AD</span>
              <div>
                <p className="text-sm font-semibold">AskDoc bot</p>
                <p className="text-xs text-slate-500">Embedded view</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="rounded-md bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                Hi, I can answer product, policy, and onboarding questions.
              </p>
              <p className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">
                Ask about pricing, setup, or process.
              </p>
            </div>
            <div className="mt-4 h-9 rounded-md border bg-white px-3 text-xs leading-9 text-slate-400">Ask a question...</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["Tone", "Fallback", "Sources", "Theme"].map((item) => (
              <div key={item} className="rounded-md border bg-white p-3 text-xs font-medium text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
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
    ["Internal knowledge", "Give employees one place to ask about benefits, tools, SOPs, org rules, and company process.", Users],
    ["Sales enablement", "Help prospects and reps compare plans, explain integrations, handle objections, and find proof points.", Briefcase],
    ["Product docs", "Turn API references, changelogs, help articles, and release notes into a conversational product expert.", BookOpen],
    ["Employee onboarding", "Guide new hires through equipment, security, rituals, handbooks, and where important resources live.", GraduationCap],
    ["Partner portals", "Give agencies, resellers, and clients self-serve answers from decks, timelines, playbooks, and FAQs.", Handshake],
    ["E-commerce concierge", "Embed a shopper assistant for sizing, materials, shipping, returns, care, and product comparisons.", ShoppingBag],
    ["Operations playbooks", "Make SOPs, escalation paths, incident notes, and recurring workflows searchable through chat.", SearchCheck]
  ] as const;

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-accent">Use cases</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
            Support is one use case. Company knowledge is the platform.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
            Build focused assistants for the places people already ask questions: public sites, product docs, customer
            portals, partner hubs, and internal team workflows.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {useCases.map(([title, copy, Icon]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">{copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MainFeatureGrid({ variant = "default" }: { variant?: "default" | "compact" }) {
  const features = [
    ["Grounded chat", "Answers use the uploaded knowledge base instead of generic AI guesses.", SearchCheck],
    ["Source visibility", "Show filenames and chunks during testing, then decide whether the bot can mention them.", ShieldCheck],
    ["Widget controls", "Enable, disable, style, and place the embedded chat without touching the host page.", PlugZap],
    ["Plan gates", "Free trials stay useful while Pro unlocks more bots, docs, theme controls, and branding removal.", Paintbrush],
    ["Use-case fit", "Create bots for support, internal knowledge, product docs, partners, onboarding, and sales.", MessageSquare],
    ["Fast onboarding", "Signup leads directly to bot setup with clear limits and upgrade paths.", Zap]
  ] as const;

  return (
    <section id="product" className={cn("bg-background", variant === "compact" ? "py-14" : "py-16")}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Product surface</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything needed for useful knowledge bots.</h2>
          <p className="mt-4 text-muted-foreground">
            The landing page promise matches the real app: create bots, upload knowledge, test answers, publish widgets,
            and upgrade when limits are reached.
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

export function MainPricingSection({ headline = "Pricing that fits a real launch path" }: { headline?: string }) {
  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Pricing</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">{headline}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Start free with one bot and five documents. Upgrade when you need more knowledge sources, more widgets, custom
            styling, and higher message volume.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIGS[plan];
            const highlighted = plan === "pro";

            return (
              <div
                key={plan}
                className={cn(
                  "rounded-lg border bg-background p-6",
                  highlighted && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{config.name}</h3>
                    <p className={cn("mt-2 text-sm", highlighted ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {config.description}
                    </p>
                  </div>
                  {highlighted ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Popular</span>
                  ) : null}
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold">{config.price}</span>
                  <span className={cn("pb-1 text-sm", highlighted ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    /mo
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {config.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-accent" : "text-primary")} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-7 w-full" variant={highlighted ? "secondary" : "outline"} asChild>
                  <Link href={SIGNUP_HREF}>{plan === "free" ? "Start free" : "Upgrade path"}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MainFinalCta({ copy = "Upload five docs, test one bot, and see the widget before you think about a paid plan." }) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-6 py-14 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-accent">Ready when your docs are</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
            Build the knowledge assistant people will actually use.
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
