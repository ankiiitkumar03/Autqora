import {
  Database,
  GitBranch,
  MessageSquare,
  Sparkles,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeProps = {
  icon: LucideIcon;
  label: string;
  title: string;
  subtitle: string;
  className?: string;
  active?: boolean;
  status?: "ok" | "run" | "idle";
};

function FlowNode({
  icon: Icon,
  label,
  title,
  subtitle,
  className,
  active,
  status = "ok",
}: NodeProps) {
  return (
    <div className={cn("absolute w-[150px]", className)}>
      <span className="mb-2 block font-mono-brand text-[8px] uppercase tracking-[0.2em] text-white/30">
        {label}
      </span>
      <div
        className={cn(
          "group relative flex items-center gap-2.5 rounded-xl border bg-[#100d18]/95 p-2.5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur",
          active
            ? "border-violet/45 shadow-[0_0_0_1px_rgba(124,92,255,0.18),0_18px_50px_-18px_rgba(94,58,255,0.55)]"
            : "border-white/[0.09]"
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            active
              ? "border-violet/30 bg-violet/15 text-violet-soft"
              : "border-white/[0.08] bg-white/[0.03] text-white/55"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium leading-tight text-white/90">
            {title}
          </p>
          <p className="mt-1 truncate text-[9.5px] leading-tight text-white/38">
            {subtitle}
          </p>
        </div>
        <span
          className={cn(
            "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
            status === "ok" && "bg-signal/80",
            status === "run" && "animate-pulse bg-violet-soft",
            status === "idle" && "bg-white/20"
          )}
        />
      </div>
    </div>
  );
}

export function WorkflowGraph({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <div className="relative h-[300px] min-w-[720px]">
        <div className="absolute inset-0 bg-dots opacity-[0.35]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,rgba(124,92,255,0.09),transparent_55%)]" />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 720 300"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="flow-line" x1="0" y1="0" x2="720" y2="0">
              <stop stopColor="rgba(255,255,255,0.22)" />
              <stop offset="0.55" stopColor="rgba(164,140,255,0.55)" />
              <stop offset="1" stopColor="rgba(124,92,255,0.28)" />
            </linearGradient>
          </defs>
          <path
            d="M150 153 H190 M340 153 H380 M530 153 H548 V78 H570 M530 153 H548 V230 H570"
            stroke="url(#flow-line)"
            strokeWidth="1.4"
          />
          <path
            d="M150 153 H190 M340 153 H380 M530 153 H548 V78 H570 M530 153 H548 V230 H570"
            stroke="#A48CFF"
            strokeWidth="1.4"
            strokeOpacity="0.7"
            className="animate-dash"
          />
          <circle cx="150" cy="153" r="2.5" fill="#A48CFF" />
          <circle cx="340" cy="153" r="2.5" fill="#A48CFF" />
          <circle cx="530" cy="153" r="2.5" fill="#A48CFF" />
        </svg>

        <FlowNode
          icon={Webhook}
          label="Trigger"
          title="Website form"
          subtitle="New lead · 8s ago"
          className="left-0 top-[110px]"
        />
        <FlowNode
          icon={Sparkles}
          label="AI step"
          title="Classify & score"
          subtitle="Claude · 0.8s"
          className="left-[190px] top-[110px]"
          active
          status="run"
        />
        <FlowNode
          icon={GitBranch}
          label="Route"
          title="Score ≥ 70"
          subtitle="Switch · 2 paths"
          className="left-[380px] top-[110px]"
        />
        <FlowNode
          icon={Database}
          label="On match"
          title="HubSpot"
          subtitle="Create contact"
          className="left-[570px] top-[34px]"
        />
        <FlowNode
          icon={MessageSquare}
          label="On match"
          title="Slack"
          subtitle="Notify #sales"
          className="left-[570px] top-[186px]"
        />

        <div className="absolute left-[190px] top-[196px] flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#0b0811]/90 px-2.5 py-1">
          <span className="h-1 w-1 rounded-full bg-signal" />
          <span className="font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/40">
            Audit trail on
          </span>
        </div>
      </div>
    </div>
  );
}
