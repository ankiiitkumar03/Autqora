import { ArrowRight, CircleDashed, LoaderCircle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/project-domain";
import type { WorkflowArtifact } from "@/lib/project-domain";
import { getProjectScenario } from "@/lib/project-scenario";

type StageState = "included" | "setup" | "pending" | "scaffold";
type WorkflowStage = { title: string; detail: string; state: StageState };

const stateStyle: Record<StageState, { label: string; classes: string }> = {
  included: { label: "In starter export", classes: "border-violet-soft/25 bg-violet-soft/[0.08] text-violet-soft" },
  setup: { label: "Needs setup", classes: "border-amber-200/20 bg-amber-100/[0.06] text-amber-100" },
  pending: { label: "Not built", classes: "border-white/[0.12] border-dashed bg-white/[0.02] text-white/50" },
  scaffold: { label: "Scaffold", classes: "border-white/[0.12] border-dashed bg-white/[0.02] text-white/50" },
};

function StageRow({ label, stages }: { label: string; stages: WorkflowStage[] }) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</p>
      <ol aria-label={label} className="flex min-w-max items-stretch gap-2 pb-2">
        {stages.map((stage, index) => {
          const state = stateStyle[stage.state];
          return (
            <li key={`${stage.title}-${index}`} className="flex items-center gap-2">
              <article className={`w-44 rounded-xl border p-3 ${stage.state === "pending" || stage.state === "scaffold" ? "border-dashed border-white/[0.14] bg-white/[0.015]" : "border-white/[0.09] bg-white/[0.025]"}`}>
                <div className="flex items-center gap-2 text-violet-soft/80"><Wrench aria-hidden="true" className="h-3.5 w-3.5" /><span className="font-mono-brand text-[9px] uppercase tracking-[0.12em]">Step {index + 1}</span></div>
                <h3 className="mt-2 text-sm font-medium leading-snug text-white/90">{stage.title}</h3>
                <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-white/50">{stage.detail}</p>
                <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[9px] leading-none ${state.classes}`}>{state.label}</span>
              </article>
              {index < stages.length - 1 && <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-white/30" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getPreview(project: Project): { title: string; description: string; rows: Array<{ label: string; stages: WorkflowStage[] }> } {
  const scenario = getProjectScenario(project);
  if (scenario.isClipPublishingPipeline) {
    return {
      title: "Live stream → Shorts → social publishing",
      description: "The project brief asks for the full pipeline. The current export can clip an archived video, pause for same-run batch approval, and optionally upload to YouTube with selectable visibility or publish Instagram Reels; remaining stages stay visible below.",
      rows: [
        {
          label: "Available in the current export",
          stages: [
            { title: "Manual run", detail: "Start from your n8n instance", state: "included" },
            { title: "Archived YouTube video", detail: "Owned or authorized; live URLs wait for replay", state: "included" },
            { title: "FFmpeg clip worker", detail: "Creates portrait 15–20 second clips", state: "setup" },
            { title: "Local MP4 links", detail: "Review and download the generated clips", state: "included" },
            { title: "Batch review form", detail: "Approve or reject the exact clips from this run before upload", state: "included" },
            { title: "YouTube upload", detail: "Optional; choose title, description and private/unlisted/public visibility", state: "setup" },
            { title: "Instagram Reels upload", detail: "Optional Meta resumable upload; opt-in publishes a real Reel", state: "setup" },
          ],
        },
        {
          label: "Still needed for the requested automation",
          stages: [
            { title: "Live stream capture", detail: "Not supported by the current archived-video worker", state: "pending" },
            { title: "Semantic moment selection", detail: "Choose meaningful highlights beyond visual cuts or manual timestamps", state: "pending" },
            { title: "Per-clip decisions and deduplication", detail: "Approve individual clips and avoid duplicate posts on retries", state: "pending" },
          ],
        },
      ],
    };
  }
  if (scenario.isYoutubeVideoClips) {
    return {
      title: "YouTube video → vertical clips",
      description: "Current starter workflow stages. It uses an archived public video, returns local links, pauses for same-run batch approval before opted-in YouTube uploads, and supports configurable title, description and visibility. It does not capture live streams.",
      rows: [{ label: "Current export", stages: [
        { title: "Manual run", detail: "Start from n8n", state: "included" },
        { title: "Set clip options", detail: "Choose even spacing, visual cuts, or user-selected timestamps", state: "included" },
        { title: "FFmpeg clip worker", detail: "Local service; API credential required", state: "setup" },
        { title: "Local MP4 links", detail: "Review clips before sharing", state: "included" },
        { title: "Batch review form", detail: "Approve the clips from this run before YouTube upload", state: "included" },
        { title: "YouTube upload", detail: "Optional; choose private, unlisted or public; requires YouTube OAuth2", state: "setup" },
      ] }],
    };
  }
  if (scenario.isGoogleSheetsLeadEmail) {
    return {
      title: "New spreadsheet row → email notification",
      description: "Starter stages are shown; Google Sheets and Gmail credentials and the target sheet still need configuration.",
      rows: [{ label: "Current export", stages: [
        { title: "New sheet row", detail: "Polling trigger in n8n", state: "setup" },
        { title: "Validate lead email", detail: "Invalid addresses follow the skip path", state: "included" },
        { title: "Format notification", detail: "Prepare a concise lead summary", state: "included" },
        { title: "Send with Gmail", detail: "Choose the account and recipient", state: "setup" },
      ] }],
    };
  }
  if (scenario.isInstagramPost) {
    return {
      title: "Schedule → prepare → publish Instagram photo",
      description: "Starter stages only. A professional account, public JPEG URL, and Meta credential are required; publishing has not been runtime-tested.",
      rows: [{ label: "Current export", stages: [
        { title: "Manual or scheduled trigger", detail: "Review the schedule before activation", state: "included" },
        { title: "Post details", detail: "Account ID, caption, and public image URL", state: "setup" },
        { title: "Create media container", detail: "Meta API request", state: "included" },
        { title: "Publish photo", detail: "Can create a real post when run", state: "setup" },
      ] }],
    };
  }
  if (scenario.isWebhookIntake) {
    return {
      title: scenario.isWebhookForward ? "Authenticated webhook → destination API" : "Authenticated webhook → response",
      description: "Starter stages are shown. Bind the generated Header Auth credential and use synthetic data for the first test.",
      rows: [{ label: "Current export", stages: [
        { title: "Receive webhook", detail: "Authenticated HTTP POST", state: "setup" },
        { title: "Map fields", detail: project.requirements.fieldMappings.length ? "Apply configured required/optional paths" : "No field mapping configured", state: "included" },
        { title: scenario.isWebhookForward ? "Forward to API" : "Return acknowledgement", detail: scenario.isWebhookForward ? "Destination credential may be required" : "Acknowledge accepted request", state: scenario.isWebhookForward ? "setup" : "included" },
      ] }],
    };
  }
  return {
    title: "Project workflow scaffold",
    description: "A visual outline of the current brief. The generated scaffold does not perform the requested automation yet.",
    rows: [{ label: "Scaffold only", stages: [
      { title: project.requirements.trigger || "Trigger", detail: "Confirm the event or schedule", state: "scaffold" },
      { title: project.requirements.sourceApp || "Source system", detail: "Connect and shape the incoming data", state: "scaffold" },
      { title: project.goal.slice(0, 48) || "Automation logic", detail: "Implementation details are still needed", state: "scaffold" },
      { title: project.requirements.destinationApp || "Destination", detail: "Choose the target action", state: "scaffold" },
    ] }],
  };
}

type DiagramNode = { name: string; type: string; position?: [number, number] };
type DiagramEdge = { source: string; target: string; output: number };

function parseWorkflowDiagram(value: Record<string, unknown>): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const rawNodes = Array.isArray(value.nodes) ? value.nodes : [];
  const nodes = rawNodes.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const node = item as Record<string, unknown>;
    if (typeof node.name !== "string" || typeof node.type !== "string") return [];
    const rawPosition = node.position;
    const position = Array.isArray(rawPosition) && rawPosition.length >= 2 && rawPosition.every(Number.isFinite)
      ? [Number(rawPosition[0]), Number(rawPosition[1])] as [number, number]
      : undefined;
    return [{ name: node.name, type: node.type, position }];
  });
  const knownNames = new Set(nodes.map((node) => node.name));
  const edges: DiagramEdge[] = [];
  const connections = value.connections;
  if (connections && typeof connections === "object") {
    for (const [source, rawOutputs] of Object.entries(connections)) {
      if (!knownNames.has(source) || !rawOutputs || typeof rawOutputs !== "object") continue;
      const main = (rawOutputs as Record<string, unknown>).main;
      if (!Array.isArray(main)) continue;
      main.forEach((rawPort, output) => {
        if (!Array.isArray(rawPort)) return;
        for (const rawEdge of rawPort) {
          if (!rawEdge || typeof rawEdge !== "object") continue;
          const target = (rawEdge as Record<string, unknown>).node;
          if (typeof target === "string" && knownNames.has(target)) edges.push({ source, target, output });
        }
      });
    }
  }
  return { nodes, edges };
}

function SavedWorkflowDiagram({ artifact, workflow }: { artifact: WorkflowArtifact; workflow: Record<string, unknown> }) {
  const { nodes: allNodes, edges: allEdges } = parseWorkflowDiagram(workflow);
  const nodes = allNodes.slice(0, 40);
  const visible = new Set(nodes.map((node) => node.name));
  const edges = allEdges.filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  const xs = nodes.map((node, index) => node.position?.[0] ?? index * 280);
  const ys = nodes.map((node) => node.position?.[1] ?? 0);
  const minX = Math.min(0, ...xs);
  const minY = Math.min(0, ...ys);
  const positions = new Map(nodes.map((node, index) => [node.name, {
    x: 24 + ((node.position?.[0] ?? index * 280) - minX) * 0.55,
    y: 32 + ((node.position?.[1] ?? 0) - minY) * 0.55,
  }]));
  const width = Math.max(620, ...[...positions.values()].map(({ x }) => x + 190));
  const height = Math.max(160, ...[...positions.values()].map(({ y }) => y + 112));
  return (
    <section aria-label={`Saved n8n workflow version ${artifact.version} diagram`} className="mt-5 rounded-2xl border border-violet-soft/15 bg-[#0a0810] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Saved workflow · v{artifact.version}</p><h2 className="mt-1 font-display text-xl text-mist">{artifact.name}</h2><p className="mt-1 text-xs text-white/50">Diagram uses the saved n8n node positions and connections. It does not indicate that the workflow has run.</p></div>
        <a href={`/api/projects/${artifact.projectId}/workflow/versions/${artifact.id}`} className="rounded-full border border-white/[0.14] px-3 py-2 text-xs text-white/75 hover:bg-white/[0.06]">Download JSON</a>
      </div>
      {nodes.length === 0 ? <p role="status" className="mt-5 rounded-lg border border-amber-100/15 bg-amber-100/[0.04] p-3 text-xs text-amber-100/80">This saved version has no renderable n8n nodes. Download its JSON to inspect the artifact.</p> : <>
        <div className="mt-5 overflow-auto rounded-xl border border-white/[0.08] bg-[#08070b]" aria-label="Scrollable workflow diagram">
          <div className="relative" style={{ width, height, minWidth: "100%" }}>
            <svg aria-hidden="true" className="absolute inset-0" width={width} height={height}>
              <defs><marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#a78bfa" /></marker></defs>
              {edges.map((edge, index) => {
                const from = positions.get(edge.source); const to = positions.get(edge.target);
                if (!from || !to) return null;
                const startX = from.x + 164; const startY = from.y + 42;
                const endX = to.x; const endY = to.y + 42;
                const bend = Math.max(30, Math.abs(endX - startX) * 0.42);
                return <path key={`${edge.source}-${edge.target}-${edge.output}-${index}`} d={`M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`} fill="none" stroke="#8b72d5" strokeOpacity="0.72" strokeWidth="2" markerEnd="url(#workflow-arrow)" />;
              })}
            </svg>
            {nodes.map((node, index) => {
              const point = positions.get(node.name)!;
              return <article key={`${node.name}-${index}`} className="absolute flex h-[84px] w-[164px] flex-col justify-center rounded-xl border border-violet-soft/25 bg-[#15111d] px-3 shadow-lg shadow-black/20" style={{ left: point.x, top: point.y }} title={node.type}>
                <span className="font-mono-brand text-[9px] uppercase tracking-wider text-violet-soft/80">{node.type.split(".").at(-1)}</span>
                <h3 className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white/90">{node.name}</h3>
              </article>;
            })}
          </div>
        </div>
        <p className="mt-3 text-[10px] text-white/40">{nodes.length} node{nodes.length === 1 ? "" : "s"} · {edges.length} connection{edges.length === 1 ? "" : "s"}{allNodes.length > nodes.length ? ` · showing first ${nodes.length} of ${allNodes.length}` : ""}</p>
      </>}
    </section>
  );
}

export function WorkflowPreview({ project, artifact }: { project: Project; artifact?: WorkflowArtifact }) {
  const [savedWorkflow, setSavedWorkflow] = useState<Record<string, unknown> | null>(null);
  const [workflowLoadError, setWorkflowLoadError] = useState("");
  const preview = getPreview(project);

  useEffect(() => {
    if (!artifact) { setSavedWorkflow(null); setWorkflowLoadError(""); return; }
    const controller = new AbortController();
    setSavedWorkflow(null);
    setWorkflowLoadError("");
    void fetch(`/api/projects/${artifact.projectId}/workflow/versions/${artifact.id}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.text();
        let result: unknown;
        try {
          result = JSON.parse(body);
        } catch {
          const contentType = response.headers.get("content-type") ?? "unknown content type";
          throw new Error(`The workflow API returned ${contentType} instead of JSON (HTTP ${response.status}). Refresh the project and confirm it is open on the same AUTQORA server.`);
        }
        if (!response.ok) {
          const message = result && typeof result === "object" && typeof (result as Record<string, unknown>).error === "string"
            ? (result as Record<string, string>).error
            : `The workflow API request failed (HTTP ${response.status}).`;
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !Array.isArray((result as Record<string, unknown>).nodes)) {
          throw new Error("The saved workflow response is missing its n8n nodes. Download its JSON to inspect the artifact.");
        }
        setSavedWorkflow(result as Record<string, unknown>);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWorkflowLoadError(error instanceof Error ? error.message : "Could not load the saved workflow JSON.");
      });
    return () => controller.abort();
  }, [artifact?.id, artifact?.projectId]);

  if (artifact && savedWorkflow) return <SavedWorkflowDiagram artifact={artifact} workflow={savedWorkflow} />;
  if (artifact) return <section aria-label="Saved workflow preview" className="mt-5 rounded-2xl border border-violet-soft/15 bg-[#0a0810] p-5 sm:p-6"><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Saved workflow · v{artifact.version}</p><p role={workflowLoadError ? "alert" : "status"} className="mt-3 flex items-center gap-2 text-xs text-white/55">{!workflowLoadError && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{workflowLoadError || "Loading the saved workflow diagram…"}</p><a className="mt-3 inline-block text-xs text-violet-soft underline underline-offset-2" href={`/api/projects/${artifact.projectId}/workflow/versions/${artifact.id}`}>Download JSON</a></section>;

  return (
    <section aria-labelledby="workflow-preview-title" className="mt-5 rounded-2xl border border-violet-soft/15 bg-[#0a0810] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-soft/20 bg-violet-soft/[0.08] text-violet-soft"><CircleDashed className="h-4 w-4" /></span>
        <div>
          <p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Workflow preview</p>
          <h2 id="workflow-preview-title" className="mt-1 font-display text-xl text-mist">{preview.title}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/55">{preview.description}</p>
        </div>
      </div>
      <div className="mt-2 overflow-x-auto pb-1">
        {preview.rows.map((row) => <StageRow key={row.label} label={row.label} stages={row.stages} />)}
      </div>
      <p className="mt-2 border-t border-white/[0.07] pt-3 text-[10px] text-white/40">Preview reflects AUTQORA's current scenario template, not evidence that the workflow has run. Purple = in starter export · amber = setup required · dashed = not built.</p>
    </section>
  );
}
