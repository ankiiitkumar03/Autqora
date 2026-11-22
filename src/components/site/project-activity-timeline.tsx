"use client";

import { useEffect, useState } from "react";
import { Activity, Bug, CheckCircle2, ClipboardCheck, FileText, LoaderCircle, Workflow } from "lucide-react";

type ActivityItem = { id: string; occurredAt: string; category: "project" | "plan" | "workflow" | "setup" | "verification" | "evidence" | "debug"; title: string; detail: string };
type ActivityResponse = { items?: ActivityItem[]; note?: string; error?: string };
const icons = { project: FileText, plan: FileText, workflow: Workflow, setup: ClipboardCheck, verification: CheckCircle2, evidence: Activity, debug: Bug };

export function ProjectActivityTimeline({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/projects/${projectId}/activity`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as ActivityResponse;
        if (!response.ok) throw new Error(result.error ?? "Could not load project activity.");
        setItems(result.items ?? []);
        setNote(result.note ?? "");
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Could not load project activity.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);

  return (
    <section aria-labelledby="project-activity-title" className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0a0810] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Implementation history</p><h2 id="project-activity-title" className="mt-2 font-display text-xl text-mist">Project activity</h2><p className="mt-1 text-xs leading-relaxed text-white/50">Saved milestones from this project, newest first.</p></div>
        {loading && <LoaderCircle aria-label="Loading activity" className="h-4 w-4 animate-spin text-white/50" />}
      </div>
      {error && <p role="alert" className="mt-4 text-xs text-[#f58ba0]">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="mt-4 text-xs text-white/50">No saved activity yet.</p>}
      {items.length > 0 && (
        <ol className="mt-5 space-y-0">
          {items.slice(0, 12).map((item, index) => {
            const Icon = icons[item.category];
            return (
              <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                {index < Math.min(items.length, 12) - 1 && <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-white/[0.08]" />}
                <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-soft/20 bg-[#100d17] text-violet-soft"><Icon className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-xs font-medium text-white/80">{item.title}</p><time className="text-[10px] text-white/40" dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString()}</time></div><p className="mt-1 break-words text-[11px] leading-relaxed text-white/50">{item.detail}</p></div>
              </li>
            );
          })}
        </ol>
      )}
      {note && <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-relaxed text-white/40">{note}</p>}
    </section>
  );
}
