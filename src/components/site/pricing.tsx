"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

const plans = [
  {
    name: "Explorer",
    tagline: "Validate the idea and choose the right stack.",
    monthly: 0,
    annual: 0,
    features: [
      "2 active projects",
      "Implementation roadmaps",
      "Tool + budget recommendations",
      "Artifact export",
      "Community templates",
    ],
  },
  {
    name: "Builder",
    tagline: "The full loop for one serious implementation at a time.",
    monthly: 29,
    annual: 23,
    popular: true,
    features: [
      "Everything in Explorer",
      "15 active projects",
      "Workflow + code generation",
      "Debugging copilot",
      "Verification engine",
      "Deployment runbooks",
      "1,500 assistant messages / mo",
    ],
  },
  {
    name: "Studio",
    tagline: "For agencies and teams shipping for multiple clients.",
    monthly: 79,
    annual: 63,
    features: [
      "Everything in Builder",
      "Unlimited projects",
      "5 seats included",
      "Multi-client workspaces",
      "Branded client reports",
      "Shared template library",
      "Priority support",
    ],
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-violet/[0.08] blur-[120px]" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            index="07"
            eyebrow="Pricing"
            title={
              <>
                Pay for execution,
                <br />
                not another seat licence.
              </>
            }
            description="Planned plans and indicative pricing. Request beta access to discuss availability."
          />

          <div className="reveal inline-flex w-fit items-center rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[11.5px] capitalize transition-colors",
                  billing === option
                    ? "bg-white/[0.09] text-white/85"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                {option}
                {option === "annual" && (
                  <span className="ml-1.5 font-mono-brand text-[7.5px] text-violet-soft/80">
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="reveal mt-14 grid gap-3 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.annual;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 sm:p-6",
                  plan.popular
                    ? "border-violet/35 bg-[linear-gradient(180deg,rgba(124,92,255,0.11),rgba(124,92,255,0.02)_45%,rgba(255,255,255,0.01))] shadow-[0_30px_80px_-40px_rgba(94,58,255,0.6)]"
                    : "border-white/[0.08] bg-white/[0.014]"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full border border-violet/30 bg-[#161024] px-2.5 py-1 font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-violet-soft">
                    <Sparkles className="h-2.5 w-2.5" />
                    Most popular
                  </span>
                )}

                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[15px] font-medium tracking-tight text-white/90">
                    {plan.name}
                  </h3>
                  {plan.name === "Studio" && (
                    <span className="font-mono-brand text-[7px] uppercase tracking-[0.12em] text-white/20">
                      For agencies
                    </span>
                  )}
                </div>
                <p className="mt-2 min-h-[34px] max-w-[26ch] text-[12px] leading-relaxed text-white/35">
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="font-display text-[2.6rem] leading-none tracking-[-0.05em] text-white/90">
                    ${price}
                  </span>
                  <span className="pb-1 text-[10px] text-white/30">
                    {price === 0 ? "forever" : "/ month"}
                  </span>
                </div>
                <p className="mt-1.5 font-mono-brand text-[7.5px] uppercase tracking-[0.12em] text-white/22">
                  {price === 0
                    ? "No card required"
                    : billing === "annual"
                      ? `Billed $${price * 12} yearly`
                      : "Billed monthly"}
                </p>

                <Link
                  href={`mailto:hello@autqora.com?subject=${encodeURIComponent(`AUTQORA ${plan.name} beta access`)}`}
                  className={cn(
                    "mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[11.5px] font-medium transition-colors",
                    plan.popular
                      ? "bg-mist text-ink hover:bg-white"
                      : "border border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  Request beta access
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

                <div className="my-6 h-px bg-white/[0.06]" />

                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className={cn(
                          "mt-0.5 h-3 w-3 shrink-0",
                          plan.popular ? "text-violet-soft" : "text-white/30"
                        )}
                        strokeWidth={2.4}
                      />
                      <span className="text-[11.5px] leading-relaxed text-white/45">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="reveal mt-3 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.014] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[13px] font-medium text-white/80">
              Enterprise & implementation partners
            </p>
            <p className="mt-1 text-[11.5px] text-white/35">
              SSO, custom retention, dedicated onboarding and invoice billing.
            </p>
          </div>
          <Link
            href="mailto:hello@autqora.com"
            className="inline-flex items-center gap-1.5 text-[12px] text-violet-soft/80 hover:text-violet-soft"
          >
            Talk to sales
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="reveal mt-5 text-[10.5px] text-white/25">
          Indicative pricing in USD; plans, availability and included limits may
          change before launch. INR billing is planned.
        </p>
      </div>
    </section>
  );
}
