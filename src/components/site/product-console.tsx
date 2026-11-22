import {
  ChevronDown,
  CircleDot,
  Folder,
  MoreHorizontal,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { WorkflowGraph } from "@/components/site/workflow-graph";

const projects = [
  { name: "Lead qualification", meta: "Sample", active: true },
  { name: "Invoice reconciliation", meta: "Example" },
  { name: "Support triage", meta: "Example" },
];

const checks = [
  { label: "Workflow schema", value: "Example" },
  { label: "Credential scopes", value: "Example" },
  { label: "Test records", value: "Example" },
  { label: "Failure alerts", value: "Example" },
  { label: "Rollback plan", value: "Example" },
];

const logs = [
  { time: "09:41:02", text: "trigger  form.submitted  →  lead_8812", tone: "muted" },
  { time: "09:41:03", text: "ai.classify  intent=high  score=84", tone: "violet" },
  { time: "09:41:04", text: "hubspot.create  contact_id=90211  ok", tone: "green" },
];

export function ProductConsole() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-16 -top-20 h-52 rounded-full bg-violet/20 blur-[110px]" />
      <div className="noise relative overflow-hidden rounded-[18px] border border-white/[0.1] bg-[#09070e]/95 shadow-[0_50px_140px_-40px_rgba(76,42,220,0.45),0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-soft/60 to-transparent" />

        <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/12" />
              <span className="h-2 w-2 rounded-full bg-white/12" />
              <span className="h-2 w-2 rounded-full bg-white/12" />
            </div>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-1.5 text-[10px] text-white/35 sm:flex">
              <Folder className="h-3 w-3" />
              Projects
              <span className="text-white/20">/</span>
              <span className="text-white/65">Lead qualification</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/20 bg-signal/[0.07] px-2 py-1 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-signal/90">
              <span className="h-1 w-1 rounded-full bg-signal" />
              Sample preview
            </span>
            <span className="hidden h-6 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[9px] text-white/50 sm:flex">
              <Play className="h-2.5 w-2.5" />
              Example test
            </span>
            <MoreHorizontal className="h-3.5 w-3.5 text-white/30" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[176px_1fr] xl:grid-cols-[176px_1fr_208px]">
          <aside className="hidden border-r border-white/[0.07] p-3 lg:block">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/30">
                Workspace
              </span>
              <Plus className="h-3 w-3 text-white/30" />
            </div>
            <div className="mt-2 space-y-1">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className={
                    project.active
                      ? "rounded-lg border border-white/[0.08] bg-white/[0.045] px-2.5 py-2"
                      : "rounded-lg px-2.5 py-2"
                  }
                >
                  <div className="flex items-center gap-2">
                    <CircleDot
                      className={
                        project.active
                          ? "h-2.5 w-2.5 text-violet-soft"
                          : "h-2.5 w-2.5 text-white/20"
                      }
                    />
                    <span
                      className={
                        project.active
                          ? "truncate text-[10px] text-white/85"
                          : "truncate text-[10px] text-white/45"
                      }
                    >
                      {project.name}
                    </span>
                  </div>
                  <p className="mt-1 pl-[18px] font-mono-brand text-[7.5px] uppercase tracking-[0.12em] text-white/25">
                    {project.meta}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/[0.06] bg-gradient-to-b from-violet/[0.09] to-transparent p-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-violet-soft" />
                <span className="text-[9px] font-medium text-white/70">
                  Architect
                </span>
              </div>
              <p className="mt-1.5 text-[8.5px] leading-relaxed text-white/35">
                Example note: add a dedupe step before the destination action.
              </p>
            </div>

            <div className="mt-5 border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-mono-brand text-[8px] uppercase tracking-[0.16em] text-white/25">
                  This month
                </span>
                <span className="text-[8px] text-white/35">64%</span>
              </div>
              <div className="mx-2 mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-violet to-violet-soft" />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[13px] font-medium tracking-tight text-white/95">
                    Lead qualification & routing
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-signal/20 bg-signal/[0.07] px-1.5 py-0.5 text-[8px] font-medium text-signal">
                    <Sparkles className="h-2.5 w-2.5" />
                    Example
                  </span>
                </div>
                <p className="mt-1 text-[9.5px] text-white/35">
                  n8n · illustrative workflow · sample status
                </p>
              </div>
              <div className="hidden items-center gap-1 rounded-md border border-white/[0.07] px-2 py-1 text-[8.5px] text-white/40 sm:flex">
                Example environment
                <ChevronDown className="h-2.5 w-2.5" />
              </div>
            </div>

            <WorkflowGraph className="px-2 sm:px-3" />

            <div className="border-t border-white/[0.07] bg-black/25 px-4 py-3 sm:px-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/25">
                  Illustrative execution log
                </span>
                <span className="font-mono-brand text-[8px] text-white/25">
                  Sample data · not live
                </span>
              </div>
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div
                    key={log.time}
                    className="flex items-center gap-2 font-mono-brand text-[8.5px] leading-none"
                  >
                    <span className="text-white/20">{log.time}</span>
                    <span
                      className={
                        log.tone === "green"
                          ? "text-signal/70"
                          : log.tone === "violet"
                            ? "text-violet-soft/80"
                            : "text-white/40"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-white/[0.07] p-4 xl:block">
            <div className="flex items-center justify-between">
              <span className="font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/30">
                Example verification
              </span>
              <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 font-mono-brand text-[8px] text-white/50">
                Preview
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-violet to-lavender" />
            </div>

            <div className="mt-4 space-y-2.5">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="h-3 w-3 text-white/25" />
                    <span className="text-[9px] text-white/45">{check.label}</span>
                  </div>
                  <span className="font-mono-brand text-[8px] text-white/30">
                    {check.value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-amber/10">
                    <span className="h-1 w-1 rounded-full bg-amber" />
                  </span>
                  <span className="text-[9px] text-white/45">Outcome</span>
                </div>
                <span className="font-mono-brand text-[8px] text-amber/80">
                  User check
                </span>
              </div>
            </div>

            <div className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-2 text-[9px] text-white/45">
              Evidence preview · illustrative
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <span className="font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/25">
                Deployment
              </span>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] text-white/45">Environment</span>
                <span className="text-[9px] text-white/70">Example</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-white/45">Rollback</span>
                <span className="text-[9px] text-white/50">Example only</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-white/45">Owner</span>
                <span className="text-[9px] text-white/70">Sample owner</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
