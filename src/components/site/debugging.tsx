import {
  ArrowRight,
  Check,
  CircleAlert,
  ImageIcon,
  ScanSearch,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import Link from "next/link";

export function Debugging() {
  return (
    <section
      id="debugging"
      className="relative border-t border-white/[0.06] py-24 sm:py-32"
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            index="05"
            eyebrow="Debugging copilot"
            title={
              <>
                When it breaks,
                <br />
                you get a diagnosis.
              </>
            }
          />
          <p className="reveal max-w-sm text-[13.5px] leading-relaxed text-white/45 lg:pb-2">
            Paste a sanitized error for a rule-based diagnosis and practical
            checks. Workflow inspection and automated fixes are planned, not
            available in this first version.
          </p>
        </div>

        <div className="reveal mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-violet/15 bg-violet/[0.035] p-4 sm:flex-row sm:items-center">
          <p className="max-w-xl text-[12px] leading-relaxed text-white/45">
            Try the first working AUTQORA tool: paste a sanitized error and get rule-based troubleshooting steps.
          </p>
          <Link href="/debug" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-mist px-4 text-[11px] font-medium text-ink transition-colors hover:bg-white">
            Open debugging helper <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="reveal mt-14 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0810]">
          <div className="flex flex-col items-start gap-2 border-b border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2.5">
            <div className="flex items-center gap-2">
              <TerminalSquare className="h-3.5 w-3.5 text-white/35" />
              <span className="break-words font-mono-brand text-[8px] uppercase tracking-[0.12em] text-white/35 sm:tracking-[0.16em]">
                Incident · lead-qualification / run 118
              </span>
            </div>
            <span className="font-mono-brand text-[7.5px] uppercase tracking-[0.12em] text-white/22">
              Illustrative example
            </span>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b border-white/[0.07] p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0567a]/20 bg-[#f0567a]/[0.06] px-2 py-0.5 font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-[#f0567a]/80">
                  <CircleAlert className="h-2.5 w-2.5" />
                  Failed
                </span>
                <span className="font-mono-brand text-[7.5px] text-white/22">
                  09:42:11 UTC
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-[#060409]">
                <div className="border-b border-white/[0.05] px-3 py-2 font-mono-brand text-[7.5px] text-white/25">
                  execution.log
                </div>
                <div className="space-y-1.5 p-3 font-mono-brand text-[8.5px] leading-relaxed">
                  <p className="text-white/30">
                    <span className="text-white/20">09:42:10</span> trigger
                    form.submitted <span className="text-signal/60">200</span>
                  </p>
                  <p className="text-white/30">
                    <span className="text-white/20">09:42:11</span> ai.classify{" "}
                    <span className="text-signal/60">200</span> score=84
                  </p>
                  <p className="text-[#f0567a]/80">
                    <span className="text-white/20">09:42:11</span> hubspot.upsert
                    <span className="ml-1 rounded bg-[#f0567a]/10 px-1">401</span>
                  </p>
                  <p className="pl-14 text-[#f0567a]/60">invalid_grant</p>
                  <p className="pl-14 text-white/28">token expired 12m ago</p>
                  <p className="text-white/22">
                    <span className="text-white/20">09:42:12</span> retry 1/3
                    <span className="text-[#f0567a]/60"> failed</span>
                  </p>
                  <p className="text-white/22">
                    <span className="text-white/20">09:42:14</span> retry 2/3
                    <span className="text-[#f0567a]/60"> failed</span>
                  </p>
                  <p className="text-white/22">
                    <span className="text-white/20">09:42:16</span> workflow halted
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-white/32">
                The log shows a failed node. It doesn’t show that another
                integration rotated the refresh token, or that the current scope
                is read-only.
              </p>
            </div>

            <div className="relative p-4 sm:p-6">
              <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-violet/20 to-transparent lg:block" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/25 bg-violet/[0.08] px-2 py-0.5 font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-violet-soft">
                  <ScanSearch className="h-2.5 w-2.5" />
                  AUTQORA diagnosis
                </span>
                <span className="font-mono-brand text-[7.5px] text-white/22">
                  3 steps to fix
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-violet/15 bg-violet/[0.04] p-3.5">
                  <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-violet-soft/60">
                    Root cause
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/60">
                    The HubSpot refresh token was rotated by another integration.
                    The stored token still has{" "}
                    <span className="font-mono-brand text-[10px] text-violet-soft">
                      contacts.read
                    </span>{" "}
                    only, so the upsert is rejected before it runs.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                  <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.14em] text-white/25">
                    Smallest safe fix
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {[
                      "Reconnect HubSpot with contacts.write",
                      "Refresh the credential in n8n, do not rebuild node",
                      "Replay run 118 against the saved payload",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-violet/25 bg-violet/10 font-mono-brand text-[6.5px] text-violet-soft">
                          {index + 1}
                        </span>
                        <span className="text-[9.5px] leading-relaxed text-white/42">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#060409]">
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2">
                    <span className="font-mono-brand text-[7.5px] text-white/25">
                      patch.diff
                    </span>
                    <span className="font-mono-brand text-[7px] text-white/20">
                      scopes
                    </span>
                  </div>
                  <pre className="p-3 font-mono-brand text-[8.5px] leading-relaxed text-white/35">
                    <code>
                      <span className="text-[#f0567a]/60">
                        - scopes: [&quot;contacts.read&quot;]
                      </span>
                      {"\n"}
                      <span className="text-signal/70">
                        + scopes: [&quot;contacts.read&quot;, &quot;contacts.write&quot;]
                      </span>
                    </code>
                  </pre>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-signal/15 bg-signal/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-signal" strokeWidth={3} />
                    <span className="text-[9px] text-white/50">
                      Replay passed · 12/12 records
                    </span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-signal/60" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.07] px-4 py-3 sm:px-6">
            <span className="font-mono-brand text-[7.5px] uppercase tracking-[0.16em] text-white/22">
              Bring any evidence
            </span>
            {[
              { icon: TerminalSquare, label: "Logs" },
              { icon: ImageIcon, label: "Screenshots" },
              { icon: Workflow, label: "Workflow files" },
              { icon: TerminalSquare, label: "Code" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[9px] text-white/35"
              >
                <Icon className="h-3 w-3 text-white/25" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
