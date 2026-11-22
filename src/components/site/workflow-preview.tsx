import { ArrowRight, CircleDashed, Wrench } from "lucide-react";
import type { Project } from "@/lib/project-domain";
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
      description: "The project brief asks for the full pipeline. The current export can clip an archived video and optionally upload privately to YouTube or publish Instagram Reels; remaining stages stay visible below.",
      rows: [
        {
          label: "Available in the current export",
          stages: [
            { title: "Manual run", detail: "Start from your n8n instance", state: "included" },
            { title: "Archived YouTube video", detail: "Public URL you own or may process", state: "included" },
            { title: "FFmpeg clip worker", detail: "Creates portrait 15–20 second clips", state: "setup" },
            { title: "Local MP4 links", detail: "Review and download the generated clips", state: "included" },
            { title: "YouTube upload", detail: "Optional; uploads privately after opt-in", state: "setup" },
            { title: "Instagram Reels upload", detail: "Optional Meta resumable upload; opt-in publishes a real Reel", state: "setup" },
          ],
        },
        {
          label: "Still needed for the requested automation",
          stages: [
            { title: "Live stream capture", detail: "Not supported by the current archived-video worker", state: "pending" },
            { title: "Moment selection and deduplication", detail: "Choose useful moments and avoid repeated clips", state: "pending" },
            { title: "In-workflow review gate", detail: "Approve clips before enabling either uploader", state: "pending" },
            { title: "YouTube public visibility", detail: "Uploads remain private until reviewed in YouTube Studio", state: "pending" },
          ],
        },
      ],
    };
  }
  if (scenario.isYoutubeVideoClips) {
    return {
      title: "YouTube video → vertical clips",
      description: "Current starter workflow stages. It uses an archived public video, returns local links, and can optionally upload clips privately to YouTube. It does not capture live streams.",
      rows: [{ label: "Current export", stages: [
        { title: "Manual run", detail: "Start from n8n", state: "included" },
        { title: "Set clip options", detail: "Video URL, count, and 15–20 second duration", state: "included" },
        { title: "FFmpeg clip worker", detail: "Local service; API credential required", state: "setup" },
        { title: "Local MP4 links", detail: "Review clips before sharing", state: "included" },
        { title: "YouTube private upload", detail: "Optional; requires YouTube OAuth2", state: "setup" },
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

export function WorkflowPreview({ project }: { project: Project }) {
  const preview = getPreview(project);
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
