"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { ToolRecommendation } from "@/lib/tool-recommendations";

type RecommendationResponse = { recommendations?: ToolRecommendation[]; basis?: string; error?: string };

export function ToolRecommendationPanel({ projectId }: { projectId: string }) {
  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([]);
  const [basis, setBasis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/projects/${projectId}/recommendations`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as RecommendationResponse;
        if (!response.ok || !result.recommendations) throw new Error(result.error ?? "Could not load tool recommendations.");
        setRecommendations(result.recommendations);
        setBasis(result.basis ?? "");
      })
      .catch((loadError: unknown) => {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setError(loadError instanceof Error ? loadError.message : "Could not load tool recommendations.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);

  return (
    <section aria-labelledby="tool-recommendations-title" className="mt-8 rounded-2xl border border-white/[0.1] bg-[#0a0810] p-5 sm:p-7">
      <p className="flex items-center gap-2 font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft"><Sparkles className="h-3.5 w-3.5" /> Tool fit</p>
      <h2 id="tool-recommendations-title" className="mt-2 font-display text-2xl tracking-tight text-mist">Recommended platforms</h2>
      {loading ? <p className="mt-4 flex items-center gap-2 text-sm text-white/55"><LoaderCircle className="h-4 w-4 animate-spin" /> Comparing options</p> : error ? <p role="alert" className="mt-4 text-sm text-[#f58ba0]">{error}</p> : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {recommendations.map((item) => (
              <article key={item.platform} className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg text-white">{item.platform}</h3><span className="rounded-full border border-violet-soft/25 px-2 py-1 text-[10px] text-violet-soft">{item.fit}</span></div>
                <p className="mt-2 text-xs text-white/55">AUTQORA coverage: {item.coverage === "starter_export" ? "starter workflow export available" : item.coverage === "partial_export" ? "partial workflow export; remaining stages are not generated" : item.coverage === "scaffold_only" ? "generic scaffold only" : "setup guidance only"}</p>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/55">Why it fits</h4><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-white/70">{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/55">Trade-offs</h4><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-white/65">{item.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul>
                <p className="mt-4 border-t border-white/[0.07] pt-3 text-xs leading-relaxed text-white/50">{item.costNote}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/40">{basis}</p>
        </>
      )}
    </section>
  );
}
