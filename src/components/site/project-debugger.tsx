"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save, SearchCheck } from "lucide-react";
import { debugPlatforms, type DebugDiagnosis, type DebugPlatform } from "@/lib/debug-diagnostics";
import type { ProjectDebugReport } from "@/lib/project-domain";

type ResponseData = { reports?: ProjectDebugReport[]; report?: ProjectDebugReport; error?: string };
type DebugScreenshot = { name: string; mediaType: "image/png" | "image/jpeg" | "image/webp"; dataUrl: string };

export function ProjectDebugger({ projectId, initialPlatform }: { projectId: string; initialPlatform: string | null }) {
  const [platform, setPlatform] = useState<DebugPlatform>(debugPlatforms.includes(initialPlatform as DebugPlatform) ? initialPlatform as DebugPlatform : "n8n");
  const [errorText, setErrorText] = useState("");
  const [expected, setExpected] = useState("");
  const [workflowJson, setWorkflowJson] = useState("");
  const [reports, setReports] = useState<ProjectDebugReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { status: string; note: string }>>({});
  const [screenshot, setScreenshot] = useState<DebugScreenshot | null>(null);
  const [screenshotError, setScreenshotError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/projects/${projectId}/debug`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as ResponseData;
        if (response.ok) setReports(result.reports ?? []);
      })
      .catch((loadError: unknown) => { if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setError("Could not load saved debug reports."); });
    return () => controller.abort();
  }, [projectId]);

  async function diagnose(mode: "rules" | "ai") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          mode,
          error: errorText,
          expected,
          workflowJson,
          ...(mode === "ai" && screenshot ? { screenshot: { mediaType: screenshot.mediaType, dataUrl: screenshot.dataUrl } } : {}),
        }),
      });
      const result = (await response.json()) as ResponseData;
      if (!response.ok || !result.report) throw new Error(result.error ?? "Could not analyze this error.");
      setReports((current) => [result.report!, ...current].slice(0, 20));
      setErrorText("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not analyze this error.");
    } finally {
      setBusy(false);
    }
  }

  function loadScreenshot(file: File | undefined) {
    setScreenshotError("");
    if (!file) return;
    setScreenshot(null);
    if (file.size > 2 * 1024 * 1024) {
      setScreenshot(null);
      setScreenshotError("Choose a screenshot smaller than 2 MB.");
      return;
    }
    const extensionType: Record<string, DebugScreenshot["mediaType"]> = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    };
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    const mediaType = (file.type || extensionType[extension]) as DebugScreenshot["mediaType"] | undefined;
    if (!mediaType || !["image/png", "image/jpeg", "image/webp"].includes(mediaType)) {
      setScreenshot(null);
      setScreenshotError("Use a PNG, JPEG, or WebP screenshot.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setScreenshot({ name: file.name, mediaType, dataUrl: reader.result });
      else setScreenshotError("Could not read that screenshot.");
    };
    reader.onerror = () => setScreenshotError("Could not read that screenshot.");
    reader.readAsDataURL(file);
  }

  async function saveStepFeedback(reportId: string, stepIndex: number, savedStatus: string, savedNote: string) {
    const key = `${reportId}:${stepIndex}`;
    const draft = feedbackDrafts[key] ?? { status: savedStatus, note: savedNote };
    setFeedbackBusy(key);
    setFeedbackError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/debug/${reportId}/steps/${stepIndex}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as ResponseData;
      if (!response.ok || !result.report) throw new Error(result.error ?? "Could not save the step outcome.");
      setReports((current) => current.map((report) => report.id === result.report!.id ? result.report! : report));
      setFeedbackDrafts((current) => ({ ...current, [key]: { status: draft.status, note: draft.note } }));
    } catch (saveError) {
      setFeedbackError(saveError instanceof Error ? saveError.message : "Could not save the step outcome.");
    } finally {
      setFeedbackBusy("");
    }
  }

  const latestReport = reports[0];
  const latest: DebugDiagnosis | undefined = latestReport?.diagnosis;
  const textareaClass = "mt-2 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 py-3 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/70 focus-visible:ring-2 focus-visible:ring-violet/30";

  return (
    <section aria-labelledby="project-debug-title" className="mt-8 rounded-2xl border border-white/[0.1] bg-[#0a0810] p-5 sm:p-7">
      <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft">Project tool</p>
      <h2 id="project-debug-title" className="mt-2 font-display text-2xl tracking-tight text-mist">Debug a failed run</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/60">Paste a sanitized error from this project. Rule-based analysis is local; suggestions are not a verified root cause.</p>
      <form onSubmit={(event) => { event.preventDefault(); void diagnose("rules"); }} className="mt-5 space-y-4">
        <div><label htmlFor="debug-platform" className="block text-sm font-medium text-white/80">Platform</label><select id="debug-platform" value={platform} onChange={(event) => setPlatform(event.target.value as DebugPlatform)} className="mt-2 h-11 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85 outline-none focus-visible:border-violet-soft/70 sm:max-w-xs">{debugPlatforms.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div><label htmlFor="debug-error" className="block text-sm font-medium text-white/80">What error did the run show?</label><textarea id="debug-error" required minLength={5} maxLength={8000} rows={5} value={errorText} onChange={(event) => setErrorText(event.target.value)} placeholder="Paste the error message or relevant log excerpt. Remove personal data if possible." className={textareaClass} /></div>
        <div><label htmlFor="debug-expected" className="block text-sm font-medium text-white/80">What did you expect? <span className="font-normal text-white/45">Optional</span></label><textarea id="debug-expected" maxLength={1000} rows={2} value={expected} onChange={(event) => setExpected(event.target.value)} className={textareaClass} /></div>
        <div><label htmlFor="debug-workflow-json" className="block text-sm font-medium text-white/80">Workflow JSON <span className="font-normal text-white/45">Optional · max 24 KB</span></label><textarea id="debug-workflow-json" maxLength={24000} rows={5} value={workflowJson} onChange={(event) => setWorkflowJson(event.target.value)} placeholder="Paste the n8n workflow JSON to check its structure, references, placeholders, and credential setup." className={textareaClass} /><p className="mt-1 text-xs leading-relaxed text-white/45">AUTQORA analyzes this in memory and saves only the diagnosis summary. Remove credentials, personal data, and private URLs before pasting.</p></div>
        <div>
          <label htmlFor="debug-screenshot" className="block text-sm font-medium text-white/80">Screenshot <span className="font-normal text-white/45">Optional · AI analysis only · max 2 MB</span></label>
          <input id="debug-screenshot" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; loadScreenshot(file); }} className="mt-2 block w-full text-xs text-white/65 file:mr-3 file:rounded-full file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-xs file:text-white/80 hover:file:bg-white/[0.12]" />
          <p className="mt-1 text-xs leading-relaxed text-white/45">The screenshot is sent to OpenAI only when you click Ask AI and is not saved in the project. Local analysis ignores it. Remove passwords, tokens, account details, and personal information before attaching.</p>
          {screenshot && <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-white/[0.08] px-3 py-2"><span className="truncate text-xs text-white/65">Attached for AI analysis: {screenshot.name}</span><button type="button" onClick={() => { setScreenshot(null); setScreenshotError(""); }} className="shrink-0 text-xs text-violet-soft underline underline-offset-2">Remove</button></div>}
          {screenshotError && <p role="alert" className="mt-2 text-xs text-[#f58ba0]">{screenshotError}</p>}
        </div>
        {error && <p role="alert" className="text-sm text-[#f58ba0]">{error}</p>}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || errorText.trim().length < 5} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-mist px-5 text-sm font-medium text-ink hover:bg-white disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}{busy ? "Analyzing" : "Analyze locally and save"}</button><button type="button" onClick={() => void diagnose("ai")} disabled={busy || errorText.trim().length < 5} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-violet-soft/35 px-4 text-sm text-white/80 hover:bg-violet/[0.1] disabled:opacity-50">{busy ? "Analyzing" : "Ask AI"}</button></div>
        <p className="text-xs leading-relaxed text-white/45">AI analysis sends the redacted error, expected outcome, saved project evidence, and recent user-reported step outcomes and notes to OpenAI only when you click Ask AI. Pasted workflow JSON is reviewed locally; only its structural summary may be sent. Remove personal data and credentials from error text and notes.</p>
      </form>
      {latest && latestReport && <article className="mt-6 rounded-xl border border-violet-soft/20 bg-violet/[0.04] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-soft">{latest.category}</p>
        <h3 className="mt-2 text-base font-semibold text-white">{latest.summary}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{latest.explanation}</p>
        {latest.screenshotAnalyzed && <p className="mt-2 text-xs text-white/45">AI analyzed the attached screenshot. The original image was not saved with this report.</p>}
        <ol className="mt-4 space-y-3 pl-5 text-sm leading-relaxed text-white/70">
          {latest.steps.map((step, index) => {
            const saved = latestReport.stepFeedback.find((item) => item.stepIndex === index);
            const key = `${latestReport.id}:${index}`;
            const draft = feedbackDrafts[key] ?? { status: saved?.status ?? "not_started", note: saved?.note ?? "" };
            return <li key={`${index}-${step}`} className="pl-1">
              <p>{step}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(150px,0.7fr)_minmax(180px,1.3fr)_auto]">
                <label className="sr-only" htmlFor={`debug-step-status-${index}`}>Outcome for recommendation {index + 1}</label>
                <select id={`debug-step-status-${index}`} value={draft.status} onChange={(event) => setFeedbackDrafts((current) => ({ ...current, [key]: { ...draft, status: event.target.value } }))} className="h-9 rounded-md border border-white/[0.12] bg-[#100d17] px-2 text-xs text-white/80 outline-none focus-visible:border-violet-soft/70">
                  <option value="not_started">Not started</option><option value="tried">Tried</option><option value="resolved">Resolved</option><option value="still_failing">Still failing</option><option value="not_applicable">Not applicable</option>
                </select>
                <label className="sr-only" htmlFor={`debug-step-note-${index}`}>Optional result note for recommendation {index + 1}</label>
                <input id={`debug-step-note-${index}`} maxLength={500} value={draft.note} onChange={(event) => setFeedbackDrafts((current) => ({ ...current, [key]: { ...draft, note: event.target.value } }))} placeholder="Optional result note (avoid secrets)" className="h-9 min-w-0 rounded-md border border-white/[0.12] bg-[#100d17] px-2 text-xs text-white/80 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/70" />
                <button type="button" disabled={feedbackBusy === key} onClick={() => void saveStepFeedback(latestReport.id, index, saved?.status ?? "not_started", saved?.note ?? "")} className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-white/[0.12] px-3 text-xs text-white/75 hover:bg-white/[0.05] disabled:opacity-50">{feedbackBusy === key ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save outcome</button>
              </div>
              {saved?.status === "resolved" && <p className="mt-1 text-[11px] text-emerald-100/70">Marked resolved by you; AUTQORA has not independently verified the fix.</p>}
              {saved && saved.status !== "not_started" && <p className="mt-1 text-[11px] text-white/40">Last saved {new Date(saved.updatedAt).toLocaleString()}</p>}
            </li>;
          })}
        </ol>
        {feedbackError && <p role="alert" className="mt-3 text-xs text-[#f58ba0]">{feedbackError}</p>}
        <p className="mt-4 text-xs leading-relaxed text-white/50">Evidence to collect: {latest.evidence}</p>
        {latest.projectContext && <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/10 p-3"><p className="text-xs font-medium text-white">Saved project context · workflow v{latest.projectContext.workflowVersion} · {latest.projectContext.scenario.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-white/55">Latest local verification: {latest.projectContext.localVerificationStatus ?? "not run"}. These checks inspect the saved JSON; they do not confirm what ran in n8n.</p>{latest.projectContext.failedLocalChecks.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/80">{latest.projectContext.failedLocalChecks.map((check) => <li key={check}>{check}</li>)}</ul>}{latest.projectContext.importedExecution && <div className="mt-3 border-t border-white/[0.08] pt-3"><p className="text-xs font-medium text-white">User-supplied execution export · {latest.projectContext.importedExecution.reportedStatus.toUpperCase()}</p><p className="mt-1 text-xs leading-relaxed text-white/55">Last node: {latest.projectContext.importedExecution.lastNodeExecuted ?? "not provided"}. Failed nodes: {latest.projectContext.importedExecution.failedNodes.join(", ") || "none reported"}. This summary was parsed from a user-provided file and is not authenticated by n8n.</p></div>}</div>}
        {latest.workflowReview && <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/10 p-3"><p className="text-xs font-medium text-white">Pasted workflow review · {latest.workflowReview.nodeCount} nodes</p>{latest.workflowReview.issues.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/80">{latest.workflowReview.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}{latest.workflowReview.securityNotes.map((note) => <p key={note} className="mt-2 text-xs text-amber-100/80">Security review: {note}</p>)}{latest.workflowReview.issues.length === 0 && latest.workflowReview.securityNotes.length === 0 && <p className="mt-2 text-xs text-emerald-100/75">No structural issues found. This does not prove n8n import or runtime behavior.</p>}<p className="mt-3 text-[11px] text-white/45">Only this review summary is saved; submitted workflow JSON is discarded after analysis.</p></div>}
        <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs leading-relaxed text-white/50">{latest.note}</p>
      </article>}
      {reports.length > 1 && <details className="mt-4"><summary className="cursor-pointer text-sm text-white/65">Earlier reports ({reports.length - 1})</summary><ul className="mt-3 space-y-2">{reports.slice(1).map((report) => <li key={report.id} className="rounded-lg border border-white/[0.07] p-3"><p className="text-xs text-violet-soft">{report.diagnosis.category} · {new Date(report.createdAt).toLocaleString()}</p><p className="mt-1 text-sm text-white/70">{report.diagnosis.summary}</p></li>)}</ul></details>}
    </section>
  );
}
