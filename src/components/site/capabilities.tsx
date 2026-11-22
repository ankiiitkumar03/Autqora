import {
  Activity,
  BadgeCheck,
  Boxes,
  Bug,
  Compass,
  FileCode2,
  MessagesSquare,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

function CapabilityCard({
  icon: Icon,
  title,
  copy,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  copy: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.075] bg-gradient-to-b from-white/[0.028] to-white/[0.008] p-5 transition-colors duration-300 hover:border-violet/25 sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-white/50 transition-colors group-hover:border-violet/25 group-hover:text-violet-soft">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div>
          <h3 className="font-display text-[13.5px] font-medium tracking-tight text-white/90">
            {title}
          </h3>
          <p className="mt-1.5 max-w-[29ch] text-[12.5px] leading-relaxed text-white/38">
            {copy}
          </p>
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Capabilities() {
  return (
    <section id="product" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeading
          index="03"
          eyebrow="Core capabilities"
          title={
            <>
              Eight capabilities.
              <br />
              <span className="text-white/38">One continuous workflow.</span>
            </>
          }
          description="Each capability shares the same project context. The plan informs the build, the build informs the debugger, and the debugger informs verification."
        />

        <div className="reveal mt-14 grid gap-3 lg:grid-cols-12">
          <CapabilityCard
            icon={Compass}
            title="Automation Architect"
            copy="Turn a rough requirement into a sequenced implementation roadmap with stack, data flow and risks."
            className="lg:col-span-7"
          >
            <div className="rounded-xl border border-white/[0.07] bg-[#08060d] p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="font-mono-brand text-[8px] uppercase tracking-[0.16em] text-white/30">
                  Implementation plan
                </span>
                <span className="rounded-full border border-violet/20 bg-violet/[0.08] px-1.5 py-0.5 font-mono-brand text-[7.5px] text-violet-soft">
                  v1.2
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["Stack", "n8n · Claude · HubSpot"],
                  ["Surface", "Form → CRM → Slack"],
                  ["Risk", "Duplicate contacts"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2.5">
                    <p className="font-mono-brand text-[7px] uppercase tracking-[0.14em] text-white/25">
                      {label}
                    </p>
                    <p className="mt-1 text-[9.5px] text-white/55">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 space-y-1.5">
                {[
                  ["01", "Connect form trigger"],
                  ["02", "Add scoring prompt"],
                  ["03", "Dedupe before CRM"],
                ].map(([n, label]) => (
                  <div
                    key={n}
                    className="flex items-center gap-2.5 rounded-md border border-white/[0.045] px-2.5 py-1.5"
                  >
                    <span className="font-mono-brand text-[7.5px] text-violet-soft/70">
                      {n}
                    </span>
                    <span className="text-[9px] text-white/45">{label}</span>
                    <span className="ml-auto h-1 w-1 rounded-full bg-signal/60" />
                  </div>
                ))}
              </div>
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={Boxes}
            title="Tool Recommender"
            copy="Choose tools, APIs and integrations against budget, scale and technical comfort — not hype."
            className="lg:col-span-5"
          >
            <div className="space-y-2">
              {[
                ["n8n", "Best fit · self-hosted", "82"],
                ["Make", "Faster setup · managed", "71"],
                ["Zapier", "Simplest · limited logic", "58"],
              ].map(([name, note, score], index) => (
                <div
                  key={name}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2",
                    index === 0
                      ? "border-violet/25 bg-violet/[0.06]"
                      : "border-white/[0.06] bg-white/[0.012]"
                  )}
                >
                  <span className="w-12 text-[10px] font-medium text-white/70">
                    {name}
                  </span>
                  <span className="flex-1 text-[9px] text-white/30">{note}</span>
                  <span className="font-mono-brand text-[8px] text-white/40">
                    {score}
                  </span>
                </div>
              ))}
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={FileCode2}
            title="Workflow Generator"
            copy="Generate n8n JSON, Python scripts, API payloads and the supporting files around them."
            className="lg:col-span-5"
          >
            <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#08060d]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f0567a]/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-signal/50" />
                </div>
                <span className="font-mono-brand text-[8px] text-white/25">
                  enrich.py
                </span>
              </div>
              <pre className="overflow-x-auto p-3 font-mono-brand text-[9px] leading-[1.75] text-white/50">
                <code>
                  <span className="text-violet-soft">@step</span>
                  {"\n"}
                  <span className="text-white/70">def</span>{" "}
                  <span className="text-lavender">enrich_lead</span>
                  (payload):{"\n"}
                  {"  "}score = llm.
                  <span className="text-lavender">classify</span>(payload.notes)
                  {"\n"}
                  {"  "}
                  <span className="text-white/70">return</span> crm.
                  <span className="text-lavender">upsert</span>
                  (payload, score)
                </code>
              </pre>
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={Bug}
            title="Debugging Copilot"
            copy="Diagnose from logs, screenshots, code and workflow files. Fix the cause, not the symptom."
            className="lg:col-span-7"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-[#f0567a]/15 bg-[#f0567a]/[0.035] p-3">
                <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-[#f0567a]/70">
                  Error · node 04
                </p>
                <p className="mt-2 font-mono-brand text-[8.5px] leading-relaxed text-white/45">
                  401 invalid_grant
                  <br />
                  token expired 00:12 ago
                </p>
              </div>
              <div className="rounded-lg border border-signal/15 bg-signal/[0.03] p-3">
                <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-signal/70">
                  Diagnosis
                </p>
                <p className="mt-2 text-[9px] leading-relaxed text-white/45">
                  Refresh token is scoped to read-only. Reconnect with write
                  access, then re-run node 04.
                </p>
              </div>
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={MessagesSquare}
            title="Implementation Assistant"
            copy="Step-by-step guidance while you build, with the next action always in view."
            className="lg:col-span-4"
          >
            <div className="space-y-1.5">
              {["Create HubSpot app", "Set OAuth scopes", "Paste client secret"].map(
                (item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                        index < 2
                          ? "border-signal/30 bg-signal/10 text-signal"
                          : "border-white/10 text-transparent"
                      )}
                    >
                      <ShieldCheck className="h-2 w-2" />
                    </span>
                    <span className="text-[9px] text-white/40">{item}</span>
                  </div>
                )
              )}
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={Activity}
            title="Progress Tracking"
            copy="Persistent projects, decisions and implementation history — across sessions."
            className="lg:col-span-4"
          >
            <div>
              <div className="flex items-end justify-between">
                <span className="font-display text-2xl tracking-tight text-white/80">
                  68<span className="text-sm text-white/30">%</span>
                </span>
                <span className="font-mono-brand text-[8px] text-white/25">
                  3 of 5 stages
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet to-lavender" />
              </div>
              <div className="mt-2 flex justify-between font-mono-brand text-[7px] uppercase tracking-[0.1em] text-white/20">
                <span>Brief</span>
                <span>Build</span>
                <span>Ship</span>
              </div>
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={BadgeCheck}
            title="Verification Engine"
            copy="Separate technically verified checks from user-confirmed outcomes. No false greens."
            className="lg:col-span-4"
          >
            <div className="space-y-1.5">
              {[
                ["Schema + credentials", "Verified", true],
                ["12 test records", "Verified", true],
                ["Business outcome", "User check", false],
              ].map(([label, status, verified]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-[9px] text-white/38">{label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono-brand text-[7px]",
                      verified
                        ? "bg-signal/[0.08] text-signal/80"
                        : "bg-amber/[0.08] text-amber/80"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        verified ? "bg-signal" : "bg-amber"
                      )}
                    />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={Rocket}
            title="Deployment Companion"
            copy="Move to production with environment checks, monitoring, alerting and a rollback path attached."
            className="lg:col-span-12"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {["Staging", "Test suite", "Approval", "Production"].map(
                (stage, index) => (
                  <div key={stage} className="flex flex-1 items-center gap-3">
                    <div
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border px-3 py-2",
                        index === 3
                          ? "border-violet/25 bg-violet/[0.06]"
                          : "border-white/[0.06] bg-white/[0.015]"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          index === 3 ? "bg-signal" : "bg-violet-soft/50"
                        )}
                      />
                      <span className="text-[9px] text-white/50">{stage}</span>
                      {index < 3 && (
                        <span className="ml-auto font-mono-brand text-[7px] text-signal/60">
                          PASS
                        </span>
                      )}
                    </div>
                    {index < 3 && (
                      <span className="hidden h-px w-4 shrink-0 bg-white/10 sm:block" />
                    )}
                  </div>
                )
              )}
            </div>
          </CapabilityCard>
        </div>
      </div>
    </section>
  );
}
