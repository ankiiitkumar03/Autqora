import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleDashed,
  Minus,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Strategy Memo",
  description:
    "A commercial, positioning, naming, domain and trademark assessment of AUTQORA — with a preliminary screening report.",
};

const scores = [
  { label: "Market need", value: 8 },
  { label: "Differentiation", value: 6 },
  { label: "Defensibility", value: 4 },
  { label: "Feasibility", value: 6 },
  { label: "Brand", value: 7 },
];

const sections = [
  ["01", "Verdict", "verdict"],
  ["02", "Competition", "competition"],
  ["03", "Positioning", "positioning"],
  ["04", "Feature realism", "features"],
  ["05", "Business model", "model"],
  ["06", "The name", "name"],
  ["07", "Screening", "screening"],
  ["08", "Risks & plan", "risks"],
];

const competitors = [
  {
    category: "Workflow platforms",
    players: "n8n, Make, Zapier",
    owns: "Execution, connectors, templates, hosting.",
    space: "Neutral implementation guidance across stacks — and independent proof that a build works.",
  },
  {
    category: "AI automation builders",
    players: "Gumloop, Lindy, Relay, Zapier Agents",
    owns: "Opinionated hosted agents with fast time-to-demo.",
    space: "Bring-your-own-stack implementations that remain portable.",
  },
  {
    category: "General assistants",
    players: "ChatGPT, Claude, Gemini",
    owns: "Planning, code snippets, unlimited patience.",
    space: "Persistent project state, tool context, execution artifacts and verification.",
  },
  {
    category: "Agencies & freelancers",
    players: "Independent implementers, boutique shops",
    owns: "Trust, accountability and done-for-you delivery.",
    space: "Productised delivery with evidence — the leverage layer for the agency itself.",
  },
  {
    category: "Observability & QA",
    players: "Platform-native logs, API monitors",
    owns: "Runtime telemetry for one platform.",
    space: "Pre-deployment verification and business-outcome confirmation across tools.",
  },
];

const features = [
  {
    name: "Automation Architect",
    verdict: "Build now",
    tone: "build",
    why: "Structured output plus real constraints (budget, stack, skill) is useful today. Differentiation comes from the constraint model, not the prose.",
  },
  {
    name: "Tool Recommender",
    verdict: "Build now",
    tone: "build",
    why: "Keep the catalogue opinionated and small at first. A recommendation without cost and failure-mode reasoning is just a list.",
  },
  {
    name: "Workflow Generator",
    verdict: "Scope tightly",
    tone: "scope",
    why: "Ship excellent n8n JSON and Python before breadth. Every generated artifact needs a test harness or it becomes technical debt for the user.",
  },
  {
    name: "Implementation Assistant",
    verdict: "Scope tightly",
    tone: "scope",
    why: "Support the top 8–10 integrations deeply. Broad, shallow guidance is where trust is lost.",
  },
  {
    name: "Debugging Copilot",
    verdict: "Build first",
    tone: "build",
    why: "Highest demonstrated value and the cleanest wedge. Logs plus workflow files produce an obvious before/after. Start here.",
  },
  {
    name: "Progress Tracking",
    verdict: "Build now",
    tone: "build",
    why: "Cheap to build, high retention value. It is the substrate for project memory and agency handoffs.",
  },
  {
    name: "Verification Engine",
    verdict: "Phase two",
    tone: "defer",
    why: "Start with deterministic checks (schema, auth, test records, alerts) and a separate human-confirmation state. Never imply universal verification.",
  },
  {
    name: "Deployment Companion",
    verdict: "Defer",
    tone: "defer",
    why: "A runbook generator is realistic now. Automated deployment across platforms is not. Sell the checklist, not a promise.",
  },
];

const domainRows = [
  {
    domain: "autqora.com",
    status: "No registry record",
    tone: "ok",
    method: "Verisign RDAP · HTTP 404 · 20 Nov 2026",
    cost: "≈ $10–20 / year",
    note: "Strong signal of availability. Confirm at registrar checkout; pricing may be premium.",
  },
  {
    domain: "autqora.io",
    status: "No registry record",
    tone: "ok",
    method: "Identity Digital RDAP · object not found · 20 Nov 2026",
    cost: "≈ $30–70 / year",
    note: "Good defensive registration for developer audiences. Not a substitute for .com.",
  },
  {
    domain: "autqora.ai",
    status: "Likely available",
    tone: "warn",
    method: "CentralNic RDAP · HTTP 404 · 20 Nov 2026",
    cost: "≈ $70–150 / year",
    note: ".ai has two-year minimums and premium tiers. Verify at an accredited registrar.",
  },
  {
    domain: "autqora.in / .co",
    status: "Not verified",
    tone: "neutral",
    method: "Registry endpoints unavailable from this environment",
    cost: "≈ $10–40 / year",
    note: "Check directly before any announcement. Do not assume availability.",
  },
  {
    domain: "Social handles",
    status: "Not verified",
    tone: "neutral",
    method: "No authenticated handle lookup performed",
    cost: "Free",
    note: "Reserve @autqora on X, LinkedIn, Instagram, YouTube and GitHub before launch.",
  },
];

const marks = [
  {
    scope: "India",
    classes: "9 · 35 · 42",
    status: "Not cleared",
    method: "Official IP India search not completed",
    cost: "₹4,500 / class (startup, individual, MSME) · ₹9,000 others",
    note: "Attorney fees commonly ₹5k–15k. Examination typically 8–24 months. File TM-A.",
  },
  {
    scope: "United States",
    classes: "9 · 35 · 42",
    status: "Not cleared",
    method: "USPTO register not queried via API",
    cost: "≈ $350 / class (base fee)",
    note: "Attorney fees commonly $1.5k–3k. Examination typically 8–14 months.",
  },
  {
    scope: "European Union",
    classes: "9 · 35 · 42",
    status: "Not cleared",
    method: "EUIPO register not queried",
    cost: "€850 first class · €50 second · €150 each additional",
    note: "Typically 4–6 months. Cover class 42 for SaaS and 35 for business services.",
  },
  {
    scope: "International",
    classes: "Madrid Protocol",
    status: "After home filing",
    method: "File through Indian or US base application",
    cost: "CHF 653 base + country fees",
    note: "Costs depend on designated members and classes. Use after a home filing.",
  },
];

function Chip({
  tone,
  children,
}: {
  tone: "build" | "scope" | "defer" | "ok" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono-brand text-[8px] uppercase tracking-[0.1em] whitespace-nowrap",
        tone === "build" && "border-signal/20 bg-signal/[0.06] text-signal/80",
        tone === "scope" && "border-violet/25 bg-violet/[0.08] text-violet-soft/85",
        tone === "defer" && "border-amber/20 bg-amber/[0.06] text-amber/80",
        tone === "ok" && "border-signal/20 bg-signal/[0.06] text-signal/80",
        tone === "warn" && "border-amber/20 bg-amber/[0.06] text-amber/80",
        tone === "neutral" && "border-white/10 bg-white/[0.03] text-white/40"
      )}
    >
      {tone === "build" && <Check className="h-2 w-2" strokeWidth={3} />}
      {tone === "scope" && <Minus className="h-2 w-2" strokeWidth={3} />}
      {tone === "defer" && <CircleDashed className="h-2 w-2" />}
      {tone === "warn" && <CircleAlert className="h-2 w-2" />}
      {tone === "neutral" && <CircleDashed className="h-2 w-2" />}
      {children}
    </span>
  );
}

function MemoSection({
  id,
  index,
  label,
  title,
  children,
}: {
  id: string;
  index: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/[0.07] py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[168px_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-2.5">
            <span className="font-mono-brand text-[10px] tracking-[0.18em] text-violet-soft">
              {index}
            </span>
            <span className="h-px w-5 bg-white/15" />
          </div>
          <p className="mt-2 font-mono-brand text-[9px] uppercase tracking-[0.2em] text-white/30">
            {label}
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[1.65rem] leading-[1.1] tracking-[-0.04em] text-mist sm:text-[2.1rem]">
            {title}
          </h2>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function StrategyPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="relative overflow-hidden border-b border-white/[0.06] pb-16 pt-32 sm:pb-20 sm:pt-40">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-grid opacity-35 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
            <div className="absolute right-[-10rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-violet/[0.12] blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-[1120px] px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-brand text-[9px] uppercase tracking-[0.2em] text-white/30">
              <span className="text-violet-soft/80">Strategy memo</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>20 November 2026</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>Internal working draft</span>
            </div>

            <div className="mt-8 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.05] px-2.5 py-1 font-mono-brand text-[9px] uppercase tracking-[0.14em] text-amber/80">
                <span className="h-1 w-1 rounded-full bg-amber" />
                Proceed with conditions
              </span>
              <h1 className="mt-6 font-display text-[clamp(2.25rem,8vw,4.3rem)] leading-[0.96] tracking-[-0.055em] text-mist sm:text-[clamp(3rem,6vw,4.3rem)]">
                A real gap.
                <br />
                <span className="text-gradient">A narrow window.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-[14px] leading-relaxed text-white/48">
                AUTQORA is commercially viable — but not because it generates
                automation plans. Planning is already commoditised. The durable
                product is the proof that an automation actually works. This memo
                assesses the market, positioning, feature set, name, domain and
                trademark exposure.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-5">
              {scores.map((score) => (
                <div key={score.label} className="bg-[#09070e] p-4 sm:p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono-brand text-[8px] uppercase tracking-[0.12em] text-white/28">
                      {score.label}
                    </span>
                    <span className="font-display text-[1.3rem] tracking-tight text-white/80">
                      {score.value}
                      <span className="text-[11px] text-white/25">/10</span>
                    </span>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet to-lavender"
                      style={{ width: `${score.value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 max-w-2xl font-mono-brand text-[9px] leading-relaxed tracking-[0.02em] text-white/22">
              Scores are directional, based on category observation and founder
              interviews yet to be completed. This is not legal advice.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[168px_1fr] lg:gap-12">
            <aside className="hidden lg:block">
              <div className="sticky top-28 border-l border-white/[0.08] pl-4">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/22">
                  Contents
                </p>
                <nav className="mt-4 space-y-2.5">
                  {sections.map(([number, label, id]) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="flex items-baseline gap-2 text-[11px] text-white/35 transition-colors hover:text-white/70"
                    >
                      <span className="font-mono-brand text-[8.5px] text-white/18">
                        {number}
                      </span>
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0">
              <MemoSection
                id="verdict"
                index="01"
                label="Verdict"
                title="The idea is sound. The wedge is not where you think."
              >
                <div className="space-y-4 text-[13.5px] leading-relaxed text-white/46">
                  <p>
                    The problem is real and easy to verify: people understand what
                    they want to automate, but cannot get the implementation
                    stable. Tool selection, authentication, debugging and
                    deployment are genuine blockers — not invented friction.
                  </p>
                  <p>
                    The risk is that “AI writes your automation” is becoming a
                    feature of the platforms themselves. n8n, Make and Zapier all
                    ship native generation and AI assistance. A standalone planner
                    is a thin layer with a short life.
                  </p>
                  <p>
                    The defensible position is narrower and more valuable:{" "}
                    <span className="text-white/75">
                      an independent implementation and verification layer
                    </span>{" "}
                    that works across the user’s existing stack, keeps project
                    memory, and produces evidence a workflow is safe to run. That
                    is a harder product to copy than a prompt.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-signal/12 bg-signal/[0.02] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-signal/60">
                      What is strong
                    </p>
                    <ul className="mt-3 space-y-2">
                      {[
                        "A specific, painful, recurring problem.",
                        "A clear promise: working execution, not advice.",
                        "Tool-agnostic positioning creates room to manoeuvre.",
                        "A premium identity that avoids the AI-tool cliché.",
                      ].map((item) => (
                        <li key={item} className="flex gap-2 text-[11.5px] leading-relaxed text-white/42">
                          <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-signal/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber/12 bg-amber/[0.02] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-amber/60">
                      What is fragile
                    </p>
                    <ul className="mt-3 space-y-2">
                      {[
                        "Planning is already free inside general assistants.",
                        "Platforms can absorb generation as a native feature.",
                        "Broken automations create support and liability burden.",
                        "Credential handling raises the trust bar immediately.",
                      ].map((item) => (
                        <li key={item} className="flex gap-2 text-[11.5px] leading-relaxed text-white/42">
                          <Minus className="mt-0.5 h-2.5 w-2.5 shrink-0 text-amber/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-violet/18 bg-violet/[0.045] p-4">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-violet-soft/70">
                    The verdict
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/58">
                    Proceed — conditional on three things: clear the name before
                    further brand spend, make verification the core product rather
                    than a feature, and win one narrow segment before expanding to
                    “everyone who wants to automate”.
                  </p>
                </div>
              </MemoSection>

              <MemoSection
                id="competition"
                index="02"
                label="Competition"
                title="Crowded at the edges. Empty in the handoff."
              >
                <p className="text-[13.5px] leading-relaxed text-white/46">
                  No direct competitor currently owns the full loop of plan →
                  generate → debug → verify → deploy across third-party tools.
                  That absence is real, but it is not permanent. The table below
                  separates what each category genuinely owns from the space it
                  leaves open.
                </p>

                <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                        {["Category", "Players", "What they own", "Space left open"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/28"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.map((row) => (
                        <tr key={row.category} className="border-b border-white/[0.05] last:border-b-0">
                          <td className="px-4 py-4 align-top text-[11.5px] font-medium text-white/62">
                            {row.category}
                          </td>
                          <td className="px-4 py-4 align-top text-[11px] leading-relaxed text-white/38">
                            {row.players}
                          </td>
                          <td className="px-4 py-4 align-top text-[11px] leading-relaxed text-white/38">
                            {row.owns}
                          </td>
                          <td className="px-4 py-4 align-top text-[11px] leading-relaxed text-white/52">
                            {row.space}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-white/32">
                  The competitive conclusion is uncomfortable but useful: AUTQORA
                  should not try to be a better workflow canvas. It should be the
                  layer that makes someone else’s canvas safe to deploy.
                </p>
              </MemoSection>

              <MemoSection
                id="positioning"
                index="03"
                label="Positioning"
                title="Own the proof, not the plan."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-violet/20 bg-violet/[0.045] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-violet-soft/65">
                      Category
                    </p>
                    <p className="mt-2 font-display text-[15px] leading-snug tracking-tight text-white/80">
                      The implementation layer for automation.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                      One-line promise
                    </p>
                    <p className="mt-2 font-display text-[15px] leading-snug tracking-tight text-white/80">
                      From automation ideas to working execution.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      title: "Beachhead",
                      copy: "Automation agencies and 10–200 person ops teams. They feel the pain weekly, pay for leverage and bring repeat work.",
                    },
                    {
                      title: "Wedge",
                      copy: "A free debugging diagnosis. It is immediate, demonstrable, and lands exactly where confidence is lowest.",
                    },
                    {
                      title: "Moat to build",
                      copy: "Verification evidence, persistent project memory and agency handoff. Not a larger template library.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                      <p className="text-[11.5px] font-medium text-white/65">{item.title}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-white/35">{item.copy}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#09070e] p-5">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                    Positioning map
                  </p>
                  <div className="relative mx-auto mt-5 aspect-square w-full max-w-[420px]">
                    <div className="absolute inset-6 border border-white/[0.07]" />
                    <div className="absolute left-1/2 top-6 h-[calc(100%-3rem)] w-px bg-white/[0.06]" />
                    <div className="absolute left-6 top-1/2 h-px w-[calc(100%-3rem)] bg-white/[0.06]" />

                    <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25">
                      Tool-agnostic
                    </span>
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25">
                      Tool-specific
                    </span>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25">
                      Advises
                    </span>
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25">
                      Executes
                    </span>

                    <span className="absolute left-[30%] top-[26%] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/40">
                      ChatGPT / Claude
                    </span>
                    <span className="absolute left-[57%] top-[38%] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/40">
                      Agencies
                    </span>
                    <span className="absolute left-[71%] top-[71%] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/40">
                      n8n / Make
                    </span>
                    <span className="absolute left-[75%] top-[22%] -translate-x-1/2 rounded-full border border-violet/35 bg-violet/[0.16] px-2.5 py-1.5 text-[9px] font-medium text-lavender shadow-[0_0_24px_-4px_rgba(124,92,255,0.6)]">
                      AUTQORA
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-white/32">
                  The positioning is differentiated only if AUTQORA stays
                  independent. Becoming a hosted builder would put it in a direct
                  fight with better-funded platforms and erase the cross-tool
                  advantage.
                </p>
              </MemoSection>

              <MemoSection
                id="features"
                index="04"
                label="Feature realism"
                title="Eight capabilities is a roadmap, not a v1."
              >
                <p className="text-[13.5px] leading-relaxed text-white/46">
                  The feature set is coherent, but shipping all eight at launch
                  would dilute the promise. The sequence below protects quality
                  and concentrates the first impression on the capability with
                  the clearest before/after.
                </p>

                <div className="mt-6 space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature.name}
                      className="grid gap-2 rounded-xl border border-white/[0.07] bg-white/[0.014] p-4 sm:grid-cols-[160px_96px_1fr] sm:items-start sm:gap-4"
                    >
                      <p className="text-[11.5px] font-medium text-white/62">
                        {feature.name}
                      </p>
                      <Chip tone={feature.tone as "build" | "scope" | "defer"}>
                        {feature.verdict}
                      </Chip>
                      <p className="text-[11px] leading-relaxed text-white/36">
                        {feature.why}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#f0567a]/15 bg-[#f0567a]/[0.02] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-[#f0567a]/60">
                      Do not build in v1
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/38">
                      An execution runtime, a universal OAuth broker, a template
                      marketplace or a full workflow canvas. Each is a company in
                      itself and invites direct comparison with platforms.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                      The quality bar
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/38">
                      Every generated artifact must import or run on the first
                      attempt for the supported set, or the value proposition
                      collapses. Narrow support is a feature, not a limitation.
                    </p>
                  </div>
                </div>
              </MemoSection>

              <MemoSection
                id="model"
                index="05"
                label="Business model"
                title="Charge for outcomes. Cap the inputs."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Explorer", "Free", "Acquire through a real diagnostic, not a fake trial."],
                    ["Builder", "$29–39 / mo", "One operator shipping real workflows. Usage-capped."],
                    ["Studio", "$79–199 / mo", "Agencies need seats, client separation and reports."],
                  ].map(([name, price, note]) => (
                    <div key={name} className="rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                      <p className="font-display text-[13px] font-medium text-white/75">{name}</p>
                      <p className="mt-1 font-mono-brand text-[11px] text-violet-soft/75">{price}</p>
                      <p className="mt-2 text-[10.5px] leading-relaxed text-white/32">{note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3 text-[13px] leading-relaxed text-white/46">
                  <p>
                    A pure subscription with unlimited model usage will be
                    margin-negative. Cap assistant messages, cache common
                    architectures and route routine work to cheaper models. Publish
                    the limits plainly.
                  </p>
                  <p>
                    The agency tier is the most attractive early revenue: higher
                    willingness to pay, repeat projects and a natural distribution
                    channel. A branded verification report is a billable artifact,
                    not a dashboard feature.
                  </p>
                  <p>
                    Start with a concierge motion for 10 design partners. Deliver
                    implementations manually, instrument where time is actually
                    spent, then automate the highest-cost step. This is faster and
                    cheaper than guessing at the product surface.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#09070e] p-4">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                    Go-to-market sequence
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Wedge", "Free log diagnosis for n8n and Python failures."],
                      ["Content", "Rank for specific errors and build tutorials, not “AI automation”."],
                      ["Partners", "Recruit 10 agencies with revenue share and client reports."],
                      ["Proof", "Publish verification methodology and real pass rates."],
                    ].map(([label, copy]) => (
                      <div key={label} className="flex gap-2">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-soft/60" />
                        <p className="text-[11px] leading-relaxed text-white/38">
                          <span className="text-white/60">{label}: </span>
                          {copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </MemoSection>

              <MemoSection
                id="name"
                index="06"
                label="The name"
                title="Distinctive, ownable, slightly hard to say."
              >
                <div className="grid gap-6 sm:grid-cols-[1fr_1fr]">
                  <div>
                    <p className="text-[13.5px] leading-relaxed text-white/46">
                      AUTQORA is stronger than most AI-startup names. It does not
                      describe a feature, it is not a generic “flow” compound, and
                      it carries a premium, slightly synthetic sound suited to
                      infrastructure. The Q is the memorable anchor.
                    </p>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-white/46">
                      The weakness is recall. The missing U after Q creates
                      spelling ambiguity, and “AUT” invites an automotive
                      association. The solution is consistency, not a rename:
                      always uppercase, always paired with the tagline in early
                      comms, and a published pronunciation —{" "}
                      <span className="font-mono-brand text-[12px] text-violet-soft/85">
                        awt-KOR-uh
                      </span>
                      .
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Distinctiveness", 8],
                      ["Memorability", 6],
                      ["Spellability", 5],
                      ["Pronounceability", 5],
                      ["Scalability", 9],
                      ["Searchability", 4],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-white/30">
                            {label}
                          </span>
                          <span className="font-mono-brand text-[9px] text-white/45">
                            {value}/10
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet to-lavender"
                            style={{ width: `${Number(value) * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-signal/12 bg-signal/[0.02] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-signal/60">
                      Keep
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/38">
                      The name and mark. A rename would discard the strongest
                      existing asset without solving the underlying recall issue.
                      Reserve AUTQUORA and AUTOCORA defensively.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber/12 bg-amber/[0.02] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-amber/60">
                      Revisit only if
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/38">
                      Clearance fails in classes 9, 35 or 42 in India, the US or
                      the EU, or a well-funded exact-name conflict appears. In that
                      case, rename before launch — not after.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                    Identity assessment
                  </p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-white/38">
                    The ribbon A/Q is appropriate: abstract, geometric and free of
                    robot, brain and circuit clichés. The Q tail is intentionally
                    subtle; at 16–24 px it is the first detail to disappear, which
                    is why the app icon uses a tighter container and the favicon
                    should never rely on the tail alone.
                  </p>
                </div>
              </MemoSection>

              <MemoSection
                id="screening"
                index="07"
                label="Screening"
                title="Preliminary domain and trademark screen."
              >
                <div className="rounded-xl border border-amber/20 bg-amber/[0.035] p-4">
                  <p className="flex items-center gap-2 font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-amber/75">
                    <CircleAlert className="h-3 w-3" />
                    Read this before acting
                  </p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-white/48">
                    This is a preliminary screen performed on 20 November 2026,
                    not a legal clearance opinion. Official trademark registers
                    could not be queried reliably from this environment. Domain
                    records can change at any moment. Do not claim availability,
                    file, or announce a name until a registrar checkout and a
                    qualified trademark attorney confirm it.
                  </p>
                </div>

                <h3 className="mt-7 font-display text-[13px] font-medium tracking-tight text-white/75">
                  Domain records
                </h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                        {["Domain", "Status", "Method", "Indicative cost", "Note"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/28"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {domainRows.map((row) => (
                        <tr key={row.domain} className="border-b border-white/[0.05] last:border-b-0">
                          <td className="px-4 py-4 align-top font-mono-brand text-[10.5px] text-white/60">
                            {row.domain}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Chip tone={row.tone as "ok" | "warn" | "neutral"}>
                              {row.status}
                            </Chip>
                          </td>
                          <td className="px-4 py-4 align-top text-[10px] leading-relaxed text-white/32">
                            {row.method}
                          </td>
                          <td className="px-4 py-4 align-top font-mono-brand text-[9.5px] text-white/42">
                            {row.cost}
                          </td>
                          <td className="px-4 py-4 align-top text-[10px] leading-relaxed text-white/36">
                            {row.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/28">
                  Interpretation: an RDAP 404 means the registry returned no
                  object. It is strong evidence, not a reservation. Premium
                  pricing, registry holds and same-day registrations can change
                  the outcome. Costs are typical market estimates, not quotes.
                </p>

                <h3 className="mt-8 font-display text-[13px] font-medium tracking-tight text-white/75">
                  Trademark exposure
                </h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                        {["Jurisdiction", "Classes", "Status", "Indicative official fee", "Note"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/28"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((row) => (
                        <tr key={row.scope} className="border-b border-white/[0.05] last:border-b-0">
                          <td className="px-4 py-4 align-top text-[11px] font-medium text-white/58">
                            {row.scope}
                          </td>
                          <td className="px-4 py-4 align-top font-mono-brand text-[9.5px] text-white/38">
                            {row.classes}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Chip tone="warn">{row.status}</Chip>
                          </td>
                          <td className="px-4 py-4 align-top text-[10px] leading-relaxed text-white/42">
                            {row.cost}
                          </td>
                          <td className="px-4 py-4 align-top text-[10px] leading-relaxed text-white/36">
                            {row.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                      Also search
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-white/35">
                      <li>Company registries: MCA (India), Companies House, state registries.</li>
                      <li>App stores, GitHub organisations and npm package names.</li>
                      <li>Social handles across all launch platforms.</li>
                      <li>Common-law use: agencies, newsletters, product directories.</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.014] p-4">
                    <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                      Recommended filing order
                    </p>
                    <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-white/35">
                      <li>1. Knock-out search in India, US and EU.</li>
                      <li>2. Register .com and primary handles immediately after clearance.</li>
                      <li>3. File class 42 first; add 9 and 35 before launch.</li>
                      <li>4. Use Madrid only after the home filing is stable.</li>
                    </ol>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-white/26">
                  Exact-name web search on 20 Nov 2026 returned no relevant
                  company, product or trademark result for “AUTQORA”. Similar
                  strings such as “Autoria” exist in unrelated sectors. Absence
                  from an index is not absence from a register.
                </p>
              </MemoSection>

              <MemoSection
                id="risks"
                index="08"
                label="Risks & plan"
                title="What could kill it — and the next 90 days."
              >
                <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                        {["Risk", "Why it matters", "Mitigation"].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/28"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Platform absorption",
                          "n8n, Make and Zapier add generation and verification natively.",
                          "Stay cross-tool and independent. Win the multi-platform agency workflow.",
                        ],
                        [
                          "Trust & liability",
                          "A broken automation can lose revenue or data.",
                          "Verification evidence, explicit limits, no guarantees, human confirmation.",
                        ],
                        [
                          "Security",
                          "Credentials and client data are high-value targets.",
                          "Scoped OAuth, encryption, redaction, audit logs, path to SOC 2.",
                        ],
                        [
                          "Margin",
                          "Long debugging sessions and strong models are expensive.",
                          "Usage caps, caching, tiered models, agency pricing.",
                        ],
                        [
                          "Support load",
                          "Every integration multiplies edge cases.",
                          "Deep support for a small set. Refuse unsupported stacks politely.",
                        ],
                        [
                          "Name challenge",
                          "A prior mark in class 42 could block launch.",
                          "Clear before spending; hold fallback names privately.",
                        ],
                      ].map(([risk, why, fix]) => (
                        <tr key={risk} className="border-b border-white/[0.05] last:border-b-0">
                          <td className="px-4 py-3.5 align-top text-[11px] font-medium text-white/58">
                            {risk}
                          </td>
                          <td className="px-4 py-3.5 align-top text-[10.5px] leading-relaxed text-white/35">
                            {why}
                          </td>
                          <td className="px-4 py-3.5 align-top text-[10.5px] leading-relaxed text-white/48">
                            {fix}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    [
                      "Weeks 1–2",
                      "Clear the name and register the domain. Interview 20 agencies and ops leads. Choose one beachhead.",
                    ],
                    [
                      "Weeks 3–6",
                      "Ship the debugging copilot for n8n JSON and Python logs as a free wedge. Recruit 10 design partners.",
                    ],
                    [
                      "Weeks 7–10",
                      "Add the Architect, n8n generation and a deterministic verification checklist. Introduce paid Builder.",
                    ],
                    [
                      "Weeks 11–13",
                      "Launch Studio for agencies with client reports. Measure time-to-first-verified-workflow and paid conversion.",
                    ],
                  ].map(([period, plan]) => (
                    <div key={period} className="grid gap-2 border-t border-white/[0.07] pt-3 sm:grid-cols-[110px_1fr]">
                      <span className="font-mono-brand text-[9px] uppercase tracking-[0.14em] text-violet-soft/65">
                        {period}
                      </span>
                      <p className="text-[12px] leading-relaxed text-white/40">{plan}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-violet/20 bg-[linear-gradient(135deg,rgba(124,92,255,0.1),rgba(124,92,255,0.02))] p-5">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-violet-soft/70">
                    Final recommendation
                  </p>
                  <p className="mt-3 font-display text-[17px] leading-snug tracking-tight text-white/82">
                    Proceed. Keep the name and the mark. Launch as the
                    verification-first implementation companion for agencies and
                    ops teams — not as a generic AI automation planner.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      "Clear the name before more spend.",
                      "Make verification the product.",
                      "Win one narrow segment first.",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-white/42">
                        <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet/25 bg-violet/10 font-mono-brand text-[8px] text-violet-soft">
                          {index + 1}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg font-mono-brand text-[8.5px] leading-relaxed tracking-[0.04em] text-white/22">
                    Method: registry RDAP queries, indexed web search and category
                    analysis, 20 Nov 2026. Not legal advice. Verify all fees,
                    statuses and availability before acting.
                  </p>
                  <Link
                    href="/brand"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-white/40 transition-colors hover:text-white"
                  >
                    Open the brand system
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </MemoSection>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
