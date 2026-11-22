"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Circle,
  FileCode2,
  FileJson,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/site/section-heading";

const tabTrigger =
  "rounded-md px-2.5 py-1.5 font-mono-brand text-[8.5px] uppercase tracking-[0.12em] text-white/35 transition-colors data-[state=active]:bg-white/[0.07] data-[state=active]:text-white/80 data-[state=active]:shadow-none";

export function ExampleProject() {
  return (
    <section
      id="example"
      className="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-violet/[0.06] blur-[120px]" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="04"
              eyebrow="Example project"
              title={
                <>
                  A real brief.
                  <br />
                  A working system.
                </>
              }
              description="Follow a single automation from a plain-language request to a verified, deployable build — with every decision and artifact attached."
            />

            <div className="reveal mt-9 space-y-4">
              {[
                ["Project", "Lead qualification & routing"],
                ["Owner", "Maya · Growth operations"],
                ["Stack", "n8n · Claude · HubSpot · Slack"],
                ["Status", "Verified · 1 check pending"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3"
                >
                  <span className="font-mono-brand text-[8px] uppercase tracking-[0.16em] text-white/28">
                    {label}
                  </span>
                  <span className="text-right text-[12px] text-white/60">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="reveal mt-8 rounded-xl border border-violet/15 bg-violet/[0.035] p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-soft" />
                <span className="font-mono-brand text-[8px] uppercase tracking-[0.16em] text-violet-soft/80">
                  Architect note
                </span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/45">
                A dedupe lookup was inserted before the CRM write. Without it,
                the form would create duplicate contacts on every retry.
              </p>
            </div>
          </div>

          <div className="reveal overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0810]/90 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                  <FileJson className="h-3 w-3 text-violet-soft/80" />
                </span>
                <div>
                  <p className="text-[10px] font-medium text-white/75">
                    lead-qualification
                  </p>
                  <p className="font-mono-brand text-[7px] uppercase tracking-[0.12em] text-white/25">
                    Project 014 · updated 2m ago
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-signal/20 bg-signal/[0.06] px-2 py-0.5 font-mono-brand text-[7px] uppercase tracking-[0.1em] text-signal/80">
                <span className="h-1 w-1 rounded-full bg-signal" />
                Ready
              </span>
            </div>

            <Tabs defaultValue="brief" className="gap-0">
              <div className="overflow-x-auto border-b border-white/[0.07] px-3 py-2">
                <TabsList className="h-auto bg-transparent p-0">
                  <TabsTrigger value="brief" className={tabTrigger}>
                    01 Brief
                  </TabsTrigger>
                  <TabsTrigger value="architecture" className={tabTrigger}>
                    02 Architecture
                  </TabsTrigger>
                  <TabsTrigger value="build" className={tabTrigger}>
                    03 Build
                  </TabsTrigger>
                  <TabsTrigger value="verify" className={tabTrigger}>
                    04 Verify
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-[420px] p-4 sm:p-5">
                <TabsContent value="brief" className="m-0 space-y-4">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-white/[0.08] bg-white/[0.035] px-3.5 py-3">
                    <p className="font-mono-brand text-[7px] uppercase tracking-[0.14em] text-white/25">
                      Maya · Original brief
                    </p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
                      “When someone fills out our pricing form, score the lead
                      against our ICP, create or update the contact in HubSpot,
                      and alert #sales if it’s a strong match. Please don’t create
                      duplicates.”
                    </p>
                  </div>

                  <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-violet/20 bg-violet/[0.055] px-3.5 py-3">
                    <p className="flex items-center gap-1.5 font-mono-brand text-[7px] uppercase tracking-[0.14em] text-violet-soft/70">
                      <Sparkles className="h-2.5 w-2.5" />
                      AUTQORA · 3 questions that change the build
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        "Which form tool sends the trigger? → Tally webhook",
                        "What counts as a strong match? → Score ≥ 70",
                        "Create or update? → Upsert by email",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2"
                        >
                          <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-signal/70" />
                          <span className="text-[9.5px] leading-relaxed text-white/45">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-white/20">
                      Inferred
                    </span>
                    {["n8n runtime", "Claude classify", "Slack alert", "Audit log"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 text-[8px] text-white/35"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="architecture" className="m-0 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["Trigger", "Tally · form.submitted"],
                      ["Enrich", "Claude · ICP prompt v2"],
                      ["Dedupe", "HubSpot · email lookup"],
                      ["Destinations", "HubSpot + Slack"],
                    ].map(([label, value], index) => (
                      <div
                        key={label}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-mono-brand text-[7px] uppercase tracking-[0.14em] text-white/25">
                            {label}
                          </p>
                          <span className="font-mono-brand text-[7px] text-violet-soft/60">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-white/55">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-[#08060d] p-3.5">
                    <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-white/25">
                      Data path
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono-brand text-[8px] text-white/40">
                      {["form", "score", "dedupe", "upsert", "alert"].map(
                        (node, index) => (
                          <span key={node} className="flex items-center gap-1.5">
                            <span className="rounded border border-white/[0.08] bg-white/[0.025] px-1.5 py-1">
                              {node}
                            </span>
                            {index < 4 && (
                              <span className="text-violet-soft/50">→</span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber/15 bg-amber/[0.03] p-3.5">
                    <p className="flex items-center gap-1.5 font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-amber/70">
                      <TriangleAlert className="h-2.5 w-2.5" />
                      Risks flagged
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[9.5px] leading-relaxed text-white/40">
                      <li>HubSpot token must include write scope.</li>
                      <li>Retries can duplicate contacts without an email key.</li>
                      <li>Prompt drift can shift the score threshold over time.</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="build" className="m-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["workflow.json", "n8n · 14 KB", FileJson],
                      ["enrich.py", "Python · 3 KB", FileCode2],
                      [".env.example", "Config · 1 KB", Lock],
                      ["README.md", "Guide · 6 KB", FileText],
                    ].map(([name, meta, Icon]) => (
                      <div
                        key={name as string}
                        className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2.5"
                      >
                        <Icon className="h-3.5 w-3.5 text-violet-soft/60" />
                        <div className="min-w-0">
                          <p className="truncate font-mono-brand text-[8.5px] text-white/60">
                            {name as string}
                          </p>
                          <p className="font-mono-brand text-[7px] text-white/22">
                            {meta as string}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#08060d]">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                      <span className="font-mono-brand text-[8px] text-white/35">
                        workflow.json
                      </span>
                      <span className="rounded border border-white/[0.07] px-1.5 py-0.5 font-mono-brand text-[7px] text-white/30">
                        Copy
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-3 font-mono-brand text-[8.5px] leading-[1.8] text-white/40">
                      <code>
                        {"{"}
                        {"\n  "}
                        <span className="text-violet-soft/80">&quot;name&quot;</span>
                        {": "}
                        <span className="text-signal/70">
                          &quot;Lead qualification&quot;
                        </span>
                        ,{"\n  "}
                        <span className="text-violet-soft/80">&quot;nodes&quot;</span>
                        {": ["}
                        {"\n    "}
                        {"{ "}
                        <span className="text-violet-soft/80">&quot;type&quot;</span>
                        {": "}
                        <span className="text-signal/70">
                          &quot;n8n-nodes-base.webhook&quot;
                        </span>
                        {" },"}
                        {"\n    "}
                        {"{ "}
                        <span className="text-violet-soft/80">&quot;type&quot;</span>
                        {": "}
                        <span className="text-signal/70">
                          &quot;@autqora/claude&quot;
                        </span>
                        {" },"}
                        {"\n    "}
                        {"{ "}
                        <span className="text-violet-soft/80">&quot;type&quot;</span>
                        {": "}
                        <span className="text-signal/70">
                          &quot;n8n-nodes-base.hubspot&quot;
                        </span>
                        {" }"}
                        {"\n  "}
                        {"]"}
                        {"\n}"}
                      </code>
                    </pre>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2">
                    <span className="text-[9px] text-white/35">
                      Import directly into n8n, or export the Python runtime.
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-white/30" />
                  </div>
                </TabsContent>

                <TabsContent value="verify" className="m-0 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-signal/15 bg-signal/[0.03] px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-signal" />
                      <div>
                        <p className="text-[10px] font-medium text-white/75">
                          7 technical checks passed
                        </p>
                        <p className="font-mono-brand text-[7px] uppercase tracking-[0.12em] text-white/25">
                          Evidence attached to project
                        </p>
                      </div>
                    </div>
                    <span className="font-mono-brand text-[9px] text-signal/80">
                      7 / 8
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      ["Workflow imports cleanly", "Verified"],
                      ["Credentials scoped correctly", "Verified"],
                      ["12 test records routed", "Verified"],
                      ["Duplicate email blocked", "Verified"],
                      ["Failure alert fires", "Verified"],
                      ["Rollback snapshot stored", "Verified"],
                      ["Deployment runbook", "Verified"],
                      ["Business outcome", "User check"],
                    ].map(([label, status], index) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border border-white/[0.045] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {index < 7 ? (
                            <Check className="h-3 w-3 text-signal/70" strokeWidth={3} />
                          ) : (
                            <Circle className="h-3 w-3 text-amber/60" />
                          )}
                          <span className="text-[9.5px] text-white/42">{label}</span>
                        </div>
                        <span
                          className={
                            index < 7
                              ? "font-mono-brand text-[7px] uppercase tracking-[0.1em] text-signal/55"
                              : "font-mono-brand text-[7px] uppercase tracking-[0.1em] text-amber/60"
                          }
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-violet-soft/70" />
                    <span className="text-[9px] text-white/35">
                      Final step: confirm the business outcome before marking
                      complete.
                    </span>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}
