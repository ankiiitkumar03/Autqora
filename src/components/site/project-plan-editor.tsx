"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, Check, Copy, FileDown, LoaderCircle, RotateCcw, Save } from "lucide-react";
import type { ManualWorkflowTestEvidence, N8nExecutionEvidence, Project, ProjectPlan, ProjectPlanFreshness, ProjectPlanInput, ProjectSetup, WorkflowArtifact, WorkflowVerification } from "@/lib/project-domain";
import { ProjectDebugger } from "@/components/site/project-debugger";
import { ToolRecommendationPanel } from "@/components/site/tool-recommendation-panel";
import { ProjectRequirementsEditor } from "@/components/site/project-requirements-editor";
import { WorkflowPreview } from "@/components/site/workflow-preview";
import { ProjectActivityTimeline } from "@/components/site/project-activity-timeline";
import { getProjectScenario } from "@/lib/project-scenario";

type ResponseData = { project?: Project; plan?: ProjectPlan; freshness?: ProjectPlanFreshness; openQuestions?: string[]; error?: string };
type SetupResponse = { checks?: ProjectSetup; error?: string };
type VersionsResponse = { versions?: WorkflowArtifact[]; error?: string };
type WebhookSecretStatus = { configured: boolean; headerName: string; credentialName: string; generatedAt: string | null };
type WebhookSecretResponse = { status?: WebhookSecretStatus; secret?: string; error?: string };
type PlanVersionsResponse = { versions?: ProjectPlan[]; error?: string };
type VerificationResponse = { reports?: WorkflowVerification[]; report?: WorkflowVerification; manualEvidence?: ManualWorkflowTestEvidence[]; executionEvidence?: N8nExecutionEvidence[]; error?: string };
type AiWorkflowDraft = { workflow: Record<string, unknown>; assumptions: string[]; limitations: string[]; note: string; scenario: string; sourceFingerprint: string };
type AiWorkflowDraftResponse = AiWorkflowDraft & { error?: string };
type EditorFields = Omit<ProjectPlanInput, "implementationSteps" | "verificationChecks"> & {
  implementationSteps: string;
  verificationChecks: string;
};

async function readApiJson<T>(response: Response, endpoint: string): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    const contentType = response.headers.get("content-type") ?? "unknown content type";
    throw new Error(`The project API ${endpoint} returned an unreadable response (HTTP ${response.status}, ${contentType}).`);
  }
}

function toFields(plan: ProjectPlan): EditorFields {
  return {
    objective: plan.objective,
    trigger: plan.trigger,
    implementationSteps: plan.implementationSteps.join("\n"),
    assumptions: plan.assumptions,
    verificationChecks: plan.verificationChecks.join("\n"),
  };
}

export function ProjectPlanEditor({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [fields, setFields] = useState<EditorFields | null>(null);
  const [revision, setRevision] = useState(1);
  const [planFreshness, setPlanFreshness] = useState<ProjectPlanFreshness>("unknown");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [setupChecks, setSetupChecks] = useState<ProjectSetup | null>(null);
  const [setupError, setSetupError] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);
  const [workflowVersions, setWorkflowVersions] = useState<WorkflowArtifact[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [importingWorkflow, setImportingWorkflow] = useState(false);
  const [importWorkflowError, setImportWorkflowError] = useState("");
  const [importWorkflowMessage, setImportWorkflowMessage] = useState("");
  const [webhookSecretStatus, setWebhookSecretStatus] = useState<WebhookSecretStatus | null>(null);
  const [webhookSecretOnce, setWebhookSecretOnce] = useState("");
  const [webhookSecretError, setWebhookSecretError] = useState("");
  const [webhookSecretBusy, setWebhookSecretBusy] = useState(false);
  const [webhookSecretCopied, setWebhookSecretCopied] = useState(false);
  const [verificationReports, setVerificationReports] = useState<WorkflowVerification[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [manualEvidence, setManualEvidence] = useState<ManualWorkflowTestEvidence[]>([]);
  const [manualArtifactId, setManualArtifactId] = useState("");
  const [manualResult, setManualResult] = useState<ManualWorkflowTestEvidence["result"]>("passed");
  const [manualEnvironment, setManualEnvironment] = useState<ManualWorkflowTestEvidence["environment"]>("n8n_test_url");
  const [manualSummary, setManualSummary] = useState("");
  const [executionReference, setExecutionReference] = useState("");
  const [savingManualEvidence, setSavingManualEvidence] = useState(false);
  const [manualEvidenceError, setManualEvidenceError] = useState("");
  const [executionEvidence, setExecutionEvidence] = useState<N8nExecutionEvidence[]>([]);
  const [executionArtifactId, setExecutionArtifactId] = useState("");
  const [executionFile, setExecutionFile] = useState<File | null>(null);
  const [reviewingExecution, setReviewingExecution] = useState(false);
  const [executionEvidenceError, setExecutionEvidenceError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);
  const [aiPlanError, setAiPlanError] = useState("");
  const [aiWorkflowDrafting, setAiWorkflowDrafting] = useState(false);
  const [aiWorkflowSaving, setAiWorkflowSaving] = useState(false);
  const [aiWorkflowDraft, setAiWorkflowDraft] = useState<AiWorkflowDraft | null>(null);
  const [aiWorkflowError, setAiWorkflowError] = useState("");
  const [aiWorkflowMessage, setAiWorkflowMessage] = useState("");
  const [planVersions, setPlanVersions] = useState<ProjectPlan[]>([]);
  const [restoringRevision, setRestoringRevision] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetch(`/api/projects/${projectId}/plan`, { cache: "no-store", signal: controller.signal }),
      fetch(`/api/projects/${projectId}/setup`, { cache: "no-store", signal: controller.signal }),
      fetch(`/api/projects/${projectId}/workflow/versions`, { cache: "no-store", signal: controller.signal }),
      fetch(`/api/projects/${projectId}/verification`, { cache: "no-store", signal: controller.signal }),
      fetch(`/api/projects/${projectId}/plan/versions`, { cache: "no-store", signal: controller.signal }),
      fetch(`/api/projects/${projectId}/webhook-secret`, { cache: "no-store", signal: controller.signal }),
    ])
      .then(async ([planResponse, setupResponse, versionsResponse, verificationResponse, planVersionsResponse, webhookSecretResponse]) => {
        const [result, setupResult, versionsResult, verificationResult, planVersionsResult, webhookSecretResult] = await Promise.all([
          readApiJson<ResponseData>(planResponse, "plan"),
          readApiJson<SetupResponse>(setupResponse, "setup checklist"),
          readApiJson<VersionsResponse>(versionsResponse, "workflow history"),
          readApiJson<VerificationResponse>(verificationResponse, "verification history"),
          readApiJson<PlanVersionsResponse>(planVersionsResponse, "plan history"),
          readApiJson<WebhookSecretResponse>(webhookSecretResponse, "webhook security status"),
        ]);
        if (!planResponse.ok || !result.project || !result.plan) throw new Error(result.error ?? "Could not load this project plan.");
        if (!setupResponse.ok || !setupResult.checks) throw new Error(setupResult.error ?? "Could not load project setup progress.");
        if (!versionsResponse.ok || !versionsResult.versions) throw new Error(versionsResult.error ?? "Could not load workflow history.");
        if (!verificationResponse.ok || !verificationResult.reports) throw new Error(verificationResult.error ?? "Could not load verification history.");
        if (!planVersionsResponse.ok || !planVersionsResult.versions) throw new Error(planVersionsResult.error ?? "Could not load plan history.");
        if (!webhookSecretResponse.ok || !webhookSecretResult.status) throw new Error(webhookSecretResult.error ?? "Could not load webhook security status.");
        setProject(result.project);
        setFields(toFields(result.plan));
        setRevision(result.plan.revision);
        setPlanFreshness(result.freshness ?? "unknown");
        setOpenQuestions(result.openQuestions ?? []);
        setSetupChecks(setupResult.checks);
        setWorkflowVersions(versionsResult.versions);
        setManualArtifactId(versionsResult.versions[0]?.id ?? "");
        setExecutionArtifactId(versionsResult.versions[0]?.id ?? "");
        setVerificationReports(verificationResult.reports);
        setManualEvidence(verificationResult.manualEvidence ?? []);
        setExecutionEvidence(verificationResult.executionEvidence ?? []);
        setPlanVersions(planVersionsResult.versions);
        setWebhookSecretStatus(webhookSecretResult.status);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Could not load this project plan.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId]);

  function update<K extends keyof EditorFields>(key: K, value: EditorFields[K]) {
    setFields((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  }

  async function refreshPlanFreshness() {
    try {
      const response = await fetch(`/api/projects/${projectId}/plan`, { cache: "no-store" });
      const result = (await response.json()) as ResponseData;
      if (response.ok && result.freshness) setPlanFreshness(result.freshness);
      if (response.ok && result.openQuestions) setOpenQuestions(result.openQuestions);
    } catch {
      // Keep the previous status if the refresh request fails; saving requirements already succeeded.
    }
  }

  async function refreshSetupChecks() {
    try {
      const response = await fetch(`/api/projects/${projectId}/setup`, { cache: "no-store" });
      const result = (await response.json()) as SetupResponse;
      if (response.ok && result.checks) setSetupChecks(result.checks);
    } catch {
      // Keep the previous checklist if the refresh fails.
    }
  }

  async function toggleSetupCheck(key: keyof ProjectSetup) {
    if (!setupChecks || setupSaving) return;
    const previous = setupChecks;
    const next = { ...previous, [key]: !previous[key] };
    setSetupChecks(next);
    setSetupSaving(true);
    setSetupError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/setup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks: next }),
      });
      const result = (await response.json()) as SetupResponse;
      if (!response.ok || !result.checks) throw new Error(result.error ?? "Could not save setup progress.");
      setSetupChecks(result.checks);
    } catch (saveError) {
      setSetupChecks(previous);
      setSetupError(saveError instanceof Error ? saveError.message : "Could not save setup progress.");
    } finally {
      setSetupSaving(false);
    }
  }

  async function downloadWorkflow() {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`, { cache: "no-store" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Could not generate this workflow.");
      }
      const workflowText = await response.text();
      let workflow: unknown;
      try {
        workflow = JSON.parse(workflowText);
      } catch {
        throw new Error("The generated workflow response was not valid JSON.");
      }
      const scenario = response.headers.get("X-Autqora-Scenario");
      const sourceFingerprint = response.headers.get("X-Autqora-Source-Fingerprint");
      const saveResponse = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_generated", scenario, sourceFingerprint, workflow }),
      });
      const saved = (await saveResponse.json()) as { error?: string; artifact?: WorkflowArtifact };
      if (!saveResponse.ok || !saved.artifact) throw new Error(saved.error ?? "Could not save this workflow version.");
      const blob = new Blob([workflowText], { type: "application/json;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "autqora-workflow.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      const historyResponse = await fetch(`/api/projects/${projectId}/workflow/versions`, { cache: "no-store" });
      const history = (await historyResponse.json()) as VersionsResponse;
      if (historyResponse.ok && history.versions) {
        setWorkflowVersions(history.versions);
        setManualArtifactId(history.versions[0]?.id ?? "");
        setExecutionArtifactId(history.versions[0]?.id ?? "");
      }
      await refreshSetupChecks();
    } catch (workflowError) {
      setDownloadError(workflowError instanceof Error ? workflowError.message : "Could not generate this workflow.");
    } finally {
      setDownloading(false);
    }
  }

  async function draftAiWorkflow() {
    setAiWorkflowDrafting(true);
    setAiWorkflowError("");
    setAiWorkflowMessage("");
    setAiWorkflowDraft(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow/ai`, { method: "POST" });
      const result = (await response.json()) as AiWorkflowDraftResponse;
      if (!response.ok || !result.workflow || !result.sourceFingerprint) throw new Error(result.error ?? "Could not draft an AI workflow.");
      setAiWorkflowDraft(result);
    } catch (draftError) {
      setAiWorkflowError(draftError instanceof Error ? draftError.message : "Could not draft an AI workflow.");
    } finally {
      setAiWorkflowDrafting(false);
    }
  }

  function downloadAiWorkflowDraft() {
    if (!aiWorkflowDraft) return;
    const blob = new Blob([JSON.stringify(aiWorkflowDraft.workflow, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    const safeProjectName = project?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project";
    anchor.download = `autqora-ai-workflow-${safeProjectName}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function saveAiWorkflowDraft() {
    if (!aiWorkflowDraft) return;
    setAiWorkflowSaving(true);
    setAiWorkflowError("");
    setAiWorkflowMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_generated", scenario: aiWorkflowDraft.scenario, sourceFingerprint: aiWorkflowDraft.sourceFingerprint, workflow: aiWorkflowDraft.workflow }),
      });
      const result = (await response.json()) as { artifact?: WorkflowArtifact; error?: string };
      if (!response.ok || !result.artifact) throw new Error(result.error ?? "Could not save the AI workflow draft.");
      const historyResponse = await fetch(`/api/projects/${projectId}/workflow/versions`, { cache: "no-store" });
      const history = (await historyResponse.json()) as VersionsResponse;
      if (historyResponse.ok && history.versions) {
        setWorkflowVersions(history.versions);
        setManualArtifactId(history.versions[0]?.id ?? "");
        setExecutionArtifactId(history.versions[0]?.id ?? "");
      }
      await refreshSetupChecks();
      setAiWorkflowDraft(null);
      setAiWorkflowMessage(`Saved as workflow version ${result.artifact.version}. It remains inactive and still needs review in n8n.`);
    } catch (saveError) {
      setAiWorkflowError(saveError instanceof Error ? saveError.message : "Could not save the AI workflow draft.");
    } finally {
      setAiWorkflowSaving(false);
    }
  }

  async function importWorkflow(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setImportingWorkflow(true);
    setImportWorkflowError("");
    setImportWorkflowMessage("");
    try {
      if (file.size > 1_048_576) throw new Error("Choose a workflow JSON file under 1 MB.");
      let workflow: unknown;
      try {
        workflow = JSON.parse(await file.text());
      } catch {
        throw new Error("This file is not valid JSON.");
      }
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });
      const result = (await response.json()) as { artifact?: WorkflowArtifact; error?: string };
      if (!response.ok || !result.artifact) throw new Error(result.error ?? "Could not import this workflow.");
      const historyResponse = await fetch(`/api/projects/${projectId}/workflow/versions`, { cache: "no-store" });
      const history = (await historyResponse.json()) as VersionsResponse;
      if (historyResponse.ok && history.versions) {
        setWorkflowVersions(history.versions);
        setManualArtifactId(history.versions[0]?.id ?? "");
        setExecutionArtifactId(history.versions[0]?.id ?? "");
      }
      await refreshSetupChecks();
      setImportWorkflowMessage(`Imported as inactive workflow v${result.artifact.version}. Run local checks before using it.`);
    } catch (importError) {
      setImportWorkflowError(importError instanceof Error ? importError.message : "Could not import this workflow.");
    } finally {
      setImportingWorkflow(false);
    }
  }

  async function generateWebhookSecret() {
    if (webhookSecretStatus?.configured && !window.confirm("Rotating this secret does not update n8n automatically. You must immediately replace the Header Auth credential in n8n and the sender’s header. Continue?")) return;
    setWebhookSecretBusy(true);
    setWebhookSecretError("");
    setWebhookSecretCopied(false);
    setWebhookSecretOnce("");
    try {
      const response = await fetch(`/api/projects/${projectId}/webhook-secret`, { method: "POST", cache: "no-store" });
      const result = (await response.json()) as WebhookSecretResponse;
      if (!response.ok || !result.secret || !result.status) throw new Error(result.error ?? "Could not generate the webhook secret.");
      setWebhookSecretStatus(result.status);
      setWebhookSecretOnce(result.secret);
    } catch (secretError) {
      setWebhookSecretError(secretError instanceof Error ? secretError.message : "Could not generate the webhook secret.");
    } finally {
      setWebhookSecretBusy(false);
    }
  }

  async function copyWebhookSecret() {
    if (!webhookSecretOnce) return;
    try {
      await navigator.clipboard.writeText(webhookSecretOnce);
      setWebhookSecretCopied(true);
    } catch {
      setWebhookSecretError("Clipboard access failed. Select and copy the one-time value manually.");
    }
  }

  async function runWorkflowChecks() {
    setVerifying(true);
    setVerificationError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/verification`, { method: "POST" });
      const result = (await response.json()) as VerificationResponse;
      if (!response.ok || !result.report) throw new Error(result.error ?? "Could not check this workflow.");
      setVerificationReports((current) => [result.report!, ...current].slice(0, 10));
    } catch (verifyError) {
      setVerificationError(verifyError instanceof Error ? verifyError.message : "Could not check this workflow.");
    } finally {
      setVerifying(false);
    }
  }

  async function recordManualTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingManualEvidence(true);
    setManualEvidenceError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "record_manual_test", artifactId: manualArtifactId, evidence: { result: manualResult, environment: manualEnvironment, summary: manualSummary, executionReference } }),
      });
      const result = (await response.json()) as { manualEvidence?: ManualWorkflowTestEvidence; error?: string };
      if (!response.ok || !result.manualEvidence) throw new Error(result.error ?? "Could not save your manual test result.");
      setManualEvidence((current) => [result.manualEvidence!, ...current].slice(0, 20));
      setManualSummary("");
      setExecutionReference("");
    } catch (saveError) {
      setManualEvidenceError(saveError instanceof Error ? saveError.message : "Could not save your manual test result.");
    } finally {
      setSavingManualEvidence(false);
    }
  }

  async function reviewExecution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!executionFile || !executionArtifactId) return;
    setReviewingExecution(true);
    setExecutionEvidenceError("");
    try {
      if (executionFile.size > 256_000) throw new Error("Choose an execution JSON file under 256 KB.");
      let execution: unknown;
      try {
        execution = JSON.parse(await executionFile.text());
      } catch {
        throw new Error("This file is not valid JSON.");
      }
      const response = await fetch(`/api/projects/${projectId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review_n8n_execution", artifactId: executionArtifactId, execution }),
      });
      const result = (await response.json()) as { executionEvidence?: N8nExecutionEvidence; error?: string };
      if (!response.ok || !result.executionEvidence) throw new Error(result.error ?? "Could not review this execution JSON.");
      setExecutionEvidence((current) => [result.executionEvidence!, ...current].slice(0, 20));
      setExecutionFile(null);
      const fileInput = document.getElementById("n8n-execution-json") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (reviewError) {
      setExecutionEvidenceError(reviewError instanceof Error ? reviewError.message : "Could not review this execution JSON.");
    } finally {
      setReviewingExecution(false);
    }
  }

  async function regeneratePlan() {
    if (!window.confirm("Regenerate the starter plan from saved requirements? This replaces the current plan draft.")) return;
    setRegenerating(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/plan`, { method: "POST" });
      const result = (await response.json()) as ResponseData;
      if (!response.ok || !result.plan) throw new Error(result.error ?? "Could not regenerate the plan.");
      setFields(toFields(result.plan));
      setRevision(result.plan.revision);
      setPlanFreshness(result.freshness ?? "current");
      setOpenQuestions(result.openQuestions ?? []);
      setSaved(true);
      await refreshPlanVersions();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not regenerate the plan.");
    } finally {
      setRegenerating(false);
    }
  }

  async function draftAiPlan() {
    setAiPlanning(true);
    setAiPlanError("");
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/plan/ai`, { method: "POST" });
      const result = (await response.json()) as { draft?: ProjectPlanInput; error?: string };
      if (!response.ok || !result.draft) throw new Error(result.error ?? "Could not draft an AI plan.");
      setFields(toFields({ ...result.draft, projectId, revision, updatedAt: "" }));
      setAiPlanError("AI draft loaded for review. Save plan when you are satisfied; it has not been saved yet.");
    } catch (draftError) {
      setAiPlanError(draftError instanceof Error ? draftError.message : "Could not draft an AI plan.");
    } finally {
      setAiPlanning(false);
    }
  }

  async function refreshPlanVersions() {
    const response = await fetch(`/api/projects/${projectId}/plan/versions`, { cache: "no-store" });
    const result = (await response.json()) as PlanVersionsResponse;
    if (response.ok && result.versions) setPlanVersions(result.versions);
  }

  async function restorePlanVersion(version: ProjectPlan) {
    if (!window.confirm(`Restore plan revision ${version.revision}? This saves it as a new revision and keeps the current version in history.`)) return;
    setRestoringRevision(version.revision);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/plan/versions/${version.revision}`, { method: "POST" });
      const result = (await response.json()) as ResponseData;
      if (!response.ok || !result.plan) throw new Error(result.error ?? "Could not restore that plan.");
      setFields(toFields(result.plan));
      setRevision(result.plan.revision);
      setPlanFreshness(result.freshness ?? "current");
      setSaved(true);
      await refreshPlanVersions();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Could not restore that plan.");
    } finally {
      setRestoringRevision(null);
    }
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fields) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: fields.objective,
          trigger: fields.trigger,
          implementationSteps: fields.implementationSteps.split("\n").map((step) => step.trim()).filter(Boolean),
          assumptions: fields.assumptions,
          verificationChecks: fields.verificationChecks.split("\n").map((check) => check.trim()).filter(Boolean),
        } satisfies ProjectPlanInput),
      });
      const result = (await response.json()) as ResponseData;
      if (!response.ok || !result.plan) throw new Error(result.error ?? "Could not save this plan.");
      setRevision(result.plan.revision);
      setPlanFreshness(result.freshness ?? "current");
      setOpenQuestions(result.openQuestions ?? []);
      setFields(toFields(result.plan));
      setSaved(true);
      await refreshPlanVersions();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this plan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-white/60"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading your plan</div>;
  if (error && !fields) return <div role="alert" className="rounded-xl border border-[#f0567a]/25 bg-[#f0567a]/[0.06] p-5 text-sm text-[#f58ba0]">{error}<p className="mt-3"><Link href="/projects" className="underline">Return to projects</Link></p></div>;
  if (!project || !fields) return null;

  const inputClass = "mt-2 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 py-3 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/70 focus-visible:ring-2 focus-visible:ring-violet/30";
  const labelClass = "block text-sm font-medium text-white/80";
  const { isInstagramPost, isWebhookIntake, isWebhookForward, isGoogleSheetsLeadEmail, isYoutubeVideoClips, isClipPublishingPipeline } = getProjectScenario(project);
  const projectWorkflowKind = getProjectScenario(project).workflowKind;
  const currentVerificationReport = verificationReports.find((report) => report.artifactId === workflowVersions[0]?.id);
  const aiDraftNodes = aiWorkflowDraft && Array.isArray(aiWorkflowDraft.workflow.nodes)
    ? aiWorkflowDraft.workflow.nodes.filter((node): node is { name: string; type: string } => Boolean(node && typeof node === "object" && typeof (node as { name?: unknown }).name === "string" && typeof (node as { type?: unknown }).type === "string"))
    : [];

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-24 sm:px-8">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      <div className="mt-8 flex flex-col gap-5 border-b border-white/[0.1] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft">Implementation plan · Revision {revision}</p>
          <h1 className="mt-3 break-words font-display text-3xl tracking-tight text-mist sm:text-4xl">{project.name}</h1>
          <p className="mt-2 text-sm text-white/60">{project.platform ?? "Platform not chosen"} · Starter plan for review</p>
          {planFreshness === "requirements_changed" && <p role="status" className="mt-2 text-xs text-amber-100/80">Saved requirements changed after this plan. Review it or regenerate the starter plan before exporting.</p>}
          {planFreshness === "unknown" && <p role="status" className="mt-2 text-xs text-white/50">This saved plan predates requirement tracking. Save or regenerate it to link it to the current brief.</p>}
          {planFreshness === "draft" && <p role="status" className="mt-2 text-xs text-white/50">Unsaved draft based on the current brief. Save the plan to create its first revision.</p>}
          {planFreshness === "current" && <p role="status" className="mt-2 text-xs text-emerald-100/65">Plan was last saved against the current requirements.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/projects/${projectId}/runbook`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/80 hover:bg-white/[0.06]"><FileDown className="h-4 w-4" /> Deployment runbook</a>
          <a href={`/api/projects/${projectId}/export`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/80 hover:bg-white/[0.06]"><FileDown className="h-4 w-4" /> Project backup</a>
          <button type="button" disabled={downloading || (isWebhookIntake && !webhookSecretStatus?.configured)} onClick={() => void downloadWorkflow()} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-soft/35 bg-violet/[0.12] px-5 text-sm font-medium text-white transition-colors hover:bg-violet/[0.2] disabled:opacity-60">
            {downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}{downloading ? "Preparing workflow" : isWebhookIntake && !webhookSecretStatus?.configured ? "Secure webhook first" : workflowVersions.length ? "Generate new version" : projectWorkflowKind === "generic_scaffold" ? "Download basic scaffold" : "Download n8n draft"}
          </button>
        </div>
      </div>
      <WorkflowPreview project={project} artifact={workflowVersions[0]} />
      {projectWorkflowKind === "generic_scaffold" && <section aria-labelledby="ai-workflow-title" className="mt-5 rounded-2xl border border-violet-soft/20 bg-violet-soft/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Optional AI draft</p><h2 id="ai-workflow-title" className="mt-2 text-base font-medium text-white">Draft a tailored n8n workflow</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">Uses the saved project brief, requirements, and latest saved plan. AUTQORA redacts common secret patterns and withholds the destination URL. AI is called only when you click; generated JSON is not saved until you choose to save it.</p></div>
          <button type="button" onClick={() => void draftAiWorkflow()} disabled={aiWorkflowDrafting || aiWorkflowSaving} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-soft/35 px-4 text-xs text-white hover:bg-violet/[0.1] disabled:opacity-50">{aiWorkflowDrafting && <LoaderCircle className="h-4 w-4 animate-spin" />}{aiWorkflowDrafting ? "Drafting" : "Draft workflow"}</button>
        </div>
        {aiWorkflowError && <p role="alert" className="mt-4 rounded-lg border border-[#f0567a]/20 bg-[#f0567a]/[0.05] px-3 py-2.5 text-xs text-[#f58ba0]">{aiWorkflowError}</p>}
        {aiWorkflowMessage && <p role="status" className="mt-4 text-xs leading-relaxed text-emerald-200">{aiWorkflowMessage}</p>}
        {aiWorkflowDraft && <div className="mt-5 border-t border-white/[0.08] pt-4">
          <p className="text-xs leading-relaxed text-white/65">{aiWorkflowDraft.note}</p>
          <h3 className="mt-4 text-xs font-medium text-white/80">Draft nodes ({aiDraftNodes.length})</h3>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">{aiDraftNodes.map((node, index) => <li key={`${index}-${node.name}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.07] bg-black/10 px-3 py-2 text-[11px]"><span className="font-mono-brand text-white/35">{index + 1}</span><span className="truncate text-white/75">{node.name}</span><span className="ml-auto max-w-[45%] truncate font-mono-brand text-[9px] text-white/35">{node.type.replace("n8n-nodes-base.", "")}</span></li>)}</ol>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><h3 className="text-xs font-medium text-white/75">Assumptions</h3>{aiWorkflowDraft.assumptions.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-white/55">{aiWorkflowDraft.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-[11px] text-white/45">None returned.</p>}</div><div><h3 className="text-xs font-medium text-white/75">Limitations to review</h3>{aiWorkflowDraft.limitations.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-amber-100/70">{aiWorkflowDraft.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-[11px] text-white/45">The AI returned no limitations; still review each node and provider requirement.</p>}</div></div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={downloadAiWorkflowDraft} disabled={aiWorkflowSaving} className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.14] px-4 text-xs text-white/80 hover:bg-white/[0.05] disabled:opacity-50"><ArrowDownToLine className="h-3.5 w-3.5" />Download draft JSON</button><button type="button" onClick={() => void saveAiWorkflowDraft()} disabled={aiWorkflowSaving} className="inline-flex h-9 items-center gap-2 rounded-full bg-mist px-4 text-xs font-medium text-ink hover:bg-white disabled:opacity-50">{aiWorkflowSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{aiWorkflowSaving ? "Saving draft" : "Save as workflow version"}</button></div>
        </div>}
      </section>}
      <ProjectActivityTimeline projectId={projectId} />
      <ProjectRequirementsEditor projectId={projectId} initialRequirements={project.requirements} onSaved={() => void refreshPlanFreshness()} />
      {openQuestions.length > 0 && <section aria-labelledby="open-requirements-title" className="mt-5 rounded-xl border border-amber-200/15 bg-amber-100/[0.035] p-4"><h2 id="open-requirements-title" className="text-sm font-medium text-amber-50/90">Questions to answer before building</h2><p className="mt-1 text-xs leading-relaxed text-white/50">These are missing details from the saved brief, not assumptions AUTQORA has filled in.</p><ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-white/70">{openQuestions.map((question) => <li key={question}>{question}</li>)}</ul></section>}
      {isWebhookIntake && webhookSecretStatus && (
        <section aria-labelledby="webhook-auth-title" className="mt-5 rounded-2xl border border-violet-soft/20 bg-violet-soft/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-violet-soft">Webhook security</p><h2 id="webhook-auth-title" className="mt-2 text-base font-medium text-white">Protect incoming requests</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">AUTQORA generates 256-bit random secret material and stores only its SHA-256 hash. The raw value appears once here, never in workflow exports or project history.</p></div>
            <button type="button" disabled={webhookSecretBusy} onClick={() => void generateWebhookSecret()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-soft/35 px-4 text-xs text-white hover:bg-violet/[0.1] disabled:opacity-50">{webhookSecretBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : webhookSecretStatus.configured ? <RotateCcw className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{webhookSecretBusy ? "Generating" : webhookSecretStatus.configured ? "Rotate secret" : "Generate one-time secret"}</button>
          </div>
          {webhookSecretStatus.configured && <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-white/65"><p>Status: <span className="text-emerald-200">generated in AUTQORA · ••••••••••••••••</span> <span className="text-white/45">(masked; n8n binding is not verified)</span></p><p className="mt-1">Header: <code className="text-violet-soft">{webhookSecretStatus.headerName}</code></p><p className="mt-1">n8n credential: <code className="text-violet-soft">{webhookSecretStatus.credentialName}</code></p><p className="mt-1">Generated: {webhookSecretStatus.generatedAt ? new Date(webhookSecretStatus.generatedAt).toLocaleString() : "unknown"}</p></div>}
          {webhookSecretOnce && <div className="mt-4 rounded-lg border border-amber-200/25 bg-amber-100/[0.06] p-4"><p className="text-xs font-medium text-amber-50">Copy this secret now. AUTQORA cannot show it again.</p><code className="mt-2 block overflow-x-auto rounded bg-black/30 p-3 font-mono text-xs text-white">{webhookSecretOnce}</code><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void copyWebhookSecret()} className="inline-flex h-9 items-center gap-2 rounded-full bg-mist px-3 text-xs font-medium text-ink"><Copy className="h-3.5 w-3.5" />{webhookSecretCopied ? "Copied" : "Copy secret"}</button><button type="button" onClick={() => { setWebhookSecretOnce(""); setWebhookSecretCopied(false); }} className="h-9 rounded-full border border-white/[0.15] px-3 text-xs text-white/75">Hide secret</button></div></div>}
          {webhookSecretStatus.configured && <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-white/65"><li>After importing the workflow into n8n, create a <strong className="text-white">Header Auth</strong> credential named <code>{webhookSecretStatus.credentialName}</code>, set its header name to <code>{webhookSecretStatus.headerName}</code>, and paste the one-time secret as its value.</li><li>Select that credential on <code>Receive webhook request</code>. The export includes a credential reference template, but n8n assigns the actual credential ID in your instance.</li><li>Export the updated inactive workflow from n8n and upload it back here if you want AUTQORA’s local checks to see the real credential reference. Configure the sender with the same header and value.</li><li>Keep the workflow inactive until an authenticated synthetic test passes.</li></ol>}
          {webhookSecretStatus.configured && webhookSecretOnce && <p className="mt-3 text-[11px] leading-relaxed text-amber-50/75">If this response is lost or hidden before you copy it, rotate the secret. Rotation does not update n8n: replace the n8n credential and sender value promptly; the old value remains accepted by your n8n instance until you replace it there.</p>}
          {webhookSecretError && <p role="alert" className="mt-3 text-xs text-[#f58ba0]">{webhookSecretError}</p>}
        </section>
      )}
      {planVersions.length > 1 && (
        <details className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-medium text-white">Plan history ({planVersions.length} revisions)</summary>
          <ul className="mt-3 space-y-2">{planVersions.map((version) => <li key={version.revision} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-2"><span className="text-xs text-white/60">Revision {version.revision} · {new Date(version.updatedAt).toLocaleString()}{version.revision === revision ? " · current" : ""}</span>{version.revision !== revision && <button type="button" disabled={restoringRevision !== null} onClick={() => void restorePlanVersion(version)} className="text-xs text-violet-soft underline underline-offset-2 disabled:opacity-50">{restoringRevision === version.revision ? "Restoring…" : "Restore as new revision"}</button>}</li>)}</ul>
        </details>
      )}
      {downloadError && <p role="alert" className="mt-4 rounded-lg border border-[#f0567a]/20 bg-[#f0567a]/[0.05] px-3 py-2.5 text-sm text-[#f58ba0]">{downloadError}</p>}
      <section aria-label="Import an n8n workflow" className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <label htmlFor="workflow-json-import" className="block text-sm font-medium text-white">Bring an existing n8n workflow</label>
        <p className="mt-1 text-xs leading-relaxed text-white/50">Upload JSON to save it as a version in this project for local checks and debugging. AUTQORA forces it inactive and refuses obvious inline credentials. Keep secrets in n8n Credentials.</p>
        <input id="workflow-json-import" type="file" accept="application/json,.json" disabled={importingWorkflow} onChange={(event) => void importWorkflow(event)} className="mt-3 block w-full text-xs text-white/65 file:mr-3 file:rounded-full file:border-0 file:bg-violet-soft/15 file:px-4 file:py-2 file:text-xs file:font-medium file:text-violet-soft disabled:opacity-50" />
        {importingWorkflow && <p role="status" className="mt-2 inline-flex items-center gap-2 text-xs text-white/55"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving workflow version</p>}
        {importWorkflowError && <p role="alert" className="mt-2 text-xs text-[#f58ba0]">{importWorkflowError}</p>}
        {importWorkflowMessage && <p role="status" className="mt-2 text-xs text-emerald-200">{importWorkflowMessage}</p>}
      </section>
      {workflowVersions.length > 0 && (
        <section aria-label="Workflow export history" className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium text-white">Saved workflow versions</h2><span className="text-xs text-white/50">{workflowVersions.length} saved</span></div>
          <ul className="mt-3 space-y-2">
            {workflowVersions.slice(0, 5).map((artifact) => (
              <li key={artifact.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-xs">
              <span className="text-white/65">v{artifact.version} · {artifact.scenario === "youtube_clip_publishing_pipeline" || isClipPublishingPipeline && artifact.scenario === "youtube_video_clips" ? "Clip pipeline · partial export" : artifact.scenario === "youtube_video_clips" ? "YouTube video to shorts" : artifact.scenario === "instagram_photo_post" ? "Instagram photo post" : artifact.scenario === "google_sheets_lead_email" ? "Sheets to Gmail lead notification" : artifact.scenario === "webhook_intake" ? "Webhook intake" : artifact.scenario === "webhook_api_forward" ? "Webhook to API" : artifact.scenario === "ai_generated_n8n" ? "AI-generated n8n starter draft" : artifact.scenario === "imported_n8n" ? "Imported n8n workflow" : "Starter scaffold"} · {artifact.sourceStatus === "current" ? "matches current brief and plan" : artifact.sourceStatus === "stale" ? "brief or plan changed" : "source not recorded"} · {new Date(artifact.createdAt).toLocaleString()}</span>
                <a href={`/api/projects/${projectId}/workflow/versions/${artifact.id}`} className="text-violet-soft underline underline-offset-2">Download this version</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="workflow-verification-title" className="mt-6 rounded-2xl border border-white/[0.1] bg-[#0a0810] p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft">Local verification</p><h2 id="workflow-verification-title" className="mt-2 font-display text-xl text-mist">Check the latest workflow</h2><p className="mt-1 text-xs leading-relaxed text-white/55">Checks saved JSON only. AUTQORA does not import or execute it in n8n, test credentials, call Meta, or publish a post.</p></div>
          <button type="button" onClick={() => void runWorkflowChecks()} disabled={verifying || workflowVersions.length === 0} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-soft/30 px-4 text-sm text-white hover:bg-violet/[0.1] disabled:opacity-50">{verifying && <LoaderCircle className="h-4 w-4 animate-spin" />}{verifying ? "Checking" : "Run local checks"}</button>
        </div>
        {verificationError && <p role="alert" className="mt-3 text-sm text-[#f58ba0]">{verificationError}</p>}
        {currentVerificationReport && (
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-white">Workflow v{currentVerificationReport.artifactVersion}: {currentVerificationReport.status === "ready_for_manual_test" ? "Ready for a manual n8n test" : "Needs setup or changes"}</p><time className="text-xs text-white/45">{new Date(currentVerificationReport.createdAt).toLocaleString()}</time></div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">{currentVerificationReport.checks.map((check) => <li key={check.id} className="rounded-lg border border-white/[0.06] p-3"><p className={`text-xs font-medium ${check.passed ? "text-emerald-200" : "text-amber-100"}`}>{check.passed ? "PASS" : "REVIEW"} · {check.label}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{check.detail}</p></li>)}</ul>
            <p className="mt-3 text-[11px] leading-relaxed text-white/45">This report is not proof that n8n accepted or executed the workflow. Keep the user-confirmed setup checklist separate from machine checks.</p>
          </div>
        )}
        {workflowVersions.length > 0 && <div className="mt-5 border-t border-white/[0.08] pt-5">
          <div><h3 className="text-sm font-medium text-white">Record a manual n8n test</h3><p className="mt-1 text-xs leading-relaxed text-white/50">Choose the exact saved workflow version you tested. AUTQORA records your report as user-reported evidence; it does not independently confirm the execution.</p></div>
          <form onSubmit={(event) => void recordManualTest(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="manual-test-artifact" className="block text-xs font-medium text-white/70">Workflow version tested</label><select id="manual-test-artifact" value={manualArtifactId} onChange={(event) => setManualArtifactId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85" required>{workflowVersions.map((artifact) => <option key={artifact.id} value={artifact.id}>v{artifact.version} · {artifact.scenario.replaceAll("_", " ")}</option>)}</select></div>
            <div><label htmlFor="manual-test-result" className="block text-xs font-medium text-white/70">Test result</label><select id="manual-test-result" value={manualResult} onChange={(event) => setManualResult(event.target.value as ManualWorkflowTestEvidence["result"])} className="mt-2 h-10 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85"><option value="passed">Passed</option><option value="failed">Failed</option><option value="blocked">Blocked</option></select></div>
            <div><label htmlFor="manual-test-environment" className="block text-xs font-medium text-white/70">n8n environment</label><select id="manual-test-environment" value={manualEnvironment} onChange={(event) => setManualEnvironment(event.target.value as ManualWorkflowTestEvidence["environment"])} className="mt-2 h-10 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85"><option value="n8n_test_url">Test URL</option><option value="n8n_production_url">Production URL</option><option value="other">Other / local</option></select></div>
            <div className="sm:col-span-2"><label htmlFor="manual-test-summary" className="block text-xs font-medium text-white/70">What happened? <span className="text-white/45">10–2,000 characters</span></label><textarea id="manual-test-summary" required minLength={10} maxLength={2000} rows={3} value={manualSummary} onChange={(event) => setManualSummary(event.target.value)} placeholder="For example: sent synthetic JSON; the destination returned 200 and the workflow completed." className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 py-3 text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/70" /></div>
            <div><label htmlFor="manual-test-reference" className="block text-xs font-medium text-white/70">Execution ID or reference <span className="text-white/45">Optional</span></label><input id="manual-test-reference" maxLength={200} value={executionReference} onChange={(event) => setExecutionReference(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85 outline-none focus-visible:border-violet-soft/70" /></div>
            <div className="flex items-end"><button type="submit" disabled={savingManualEvidence || manualSummary.trim().length < 10} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/85 hover:bg-white/[0.06] disabled:opacity-50">{savingManualEvidence && <LoaderCircle className="h-4 w-4 animate-spin" />}{savingManualEvidence ? "Saving report" : "Save user-reported result"}</button></div>
            <p className="text-[11px] leading-relaxed text-white/45 sm:col-span-2">Do not include tokens, passwords, private payloads, or personal data. Common token patterns are redacted before saving.</p>
          </form>
          {manualEvidenceError && <p role="alert" className="mt-3 text-sm text-[#f58ba0]">{manualEvidenceError}</p>}
          {manualEvidence.length > 0 && <ul className="mt-4 space-y-2">{manualEvidence.slice(0, 5).map((item) => <li key={item.id} className="rounded-lg border border-white/[0.07] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-white">USER REPORTED · {item.result.toUpperCase()} · workflow v{item.artifactVersion} · {item.environment.replaceAll("_", " ")}</p><time className="text-[11px] text-white/40">{new Date(item.reportedAt).toLocaleString()}</time></div><p className="mt-1 text-xs leading-relaxed text-white/60">{item.summary}</p>{item.executionReference && <p className="mt-1 text-[11px] text-white/40">Execution reference: {item.executionReference}</p>}</li>)}</ul>}
          <form onSubmit={(event) => void reviewExecution(event)} className="mt-6 border-t border-white/[0.08] pt-5">
            <div><h3 className="text-sm font-medium text-white">Review an n8n execution export</h3><p className="mt-1 text-xs leading-relaxed text-white/50">Choose the matching saved workflow version and an execution JSON export. AUTQORA reads status and node names, discards node input/output data, and stores only that summary. Imported JSON is user supplied and is not authenticated by n8n.</p></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="execution-artifact" className="block text-xs font-medium text-white/70">Workflow version</label><select id="execution-artifact" value={executionArtifactId} onChange={(event) => setExecutionArtifactId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.12] bg-[#100d17] px-3 text-sm text-white/85">{workflowVersions.map((artifact) => <option key={artifact.id} value={artifact.id}>v{artifact.version} · {artifact.scenario.replaceAll("_", " ")}</option>)}</select></div>
              <div><label htmlFor="n8n-execution-json" className="block text-xs font-medium text-white/70">Execution JSON <span className="text-white/45">Max 256 KB</span></label><input id="n8n-execution-json" type="file" accept="application/json,.json" onChange={(event) => setExecutionFile(event.currentTarget.files?.[0] ?? null)} className="mt-2 block w-full text-xs text-white/65 file:mr-3 file:rounded-full file:border file:border-white/15 file:bg-white/[0.04] file:px-3 file:py-2 file:text-xs file:text-white/80" /></div>
            </div>
            <button type="submit" disabled={!executionFile || !executionArtifactId || reviewingExecution} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/85 hover:bg-white/[0.06] disabled:opacity-50">{reviewingExecution && <LoaderCircle className="h-4 w-4 animate-spin" />}{reviewingExecution ? "Reviewing export" : "Review execution JSON"}</button>
            {executionEvidenceError && <p role="alert" className="mt-3 text-sm text-[#f58ba0]">{executionEvidenceError}</p>}
            {executionEvidence.length > 0 && <ul className="mt-4 space-y-2">{executionEvidence.slice(0, 5).map((item) => <li key={item.id} className="rounded-lg border border-white/[0.07] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-white">USER SUPPLIED EXPORT · {item.reportedStatus.toUpperCase()} · workflow v{item.artifactVersion}{item.executionId ? ` · execution ${item.executionId}` : ""}</p><time className="text-[11px] text-white/40">{new Date(item.reportedAt).toLocaleString()}</time></div><p className="mt-1 text-xs leading-relaxed text-white/55">{item.nodeNames.length} node(s) recorded{item.lastNodeExecuted ? ` · last node: ${item.lastNodeExecuted}` : ""}{item.failedNodes.length ? ` · reported node error: ${item.failedNodes.join(", ")}` : ""}</p></li>)}</ul>}
          </form>
        </div>}
      </section>

      <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-100/[0.04] p-4 text-sm leading-relaxed text-amber-50/75">
        {isYoutubeVideoClips ? (
          isClipPublishingPipeline
            ? <>Partial export only: this inactive workflow clips an authorized archived YouTube video, returns local 15–20 second clips with their selected start times, and includes opt-in YouTube and Instagram Reels publishing paths. When publishing is opted in, the same execution pauses at a review form listing those clip links and start times. You can approve selected clips, approve all, or reject all; rejection or a 24-hour timeout sends nothing to either publisher. YouTube title, description, and visibility can be configured. Live-stream capture and automatic semantic moment selection are not implemented. Do not treat it as the complete requested automation.</>
            : <>This inactive n8n workflow sends an authorized archived YouTube video URL to the local AUTQORA FFmpeg worker, which creates up to ten vertical MP4 clips and returns their start times and local links. You may opt in to upload them to YouTube after configuring OAuth, and choose title, description, and visibility. Real-time live capture is not included.</>
        ) : isInstagramPost ? (
          <>This is a starter Instagram photo-post workflow, not a connected account. Before use, import it inactive; set the account ID, caption, and public JPEG URL in “Instagram post details”; create an n8n HTTP Header Auth credential with <code className="text-amber-50">Authorization: Bearer &lt;your Instagram User access token&gt;</code>; then select that credential on both Meta request nodes. It defaults to daily at 9:00 AM Asia/Kolkata. Test manually before publishing the schedule. Never paste a token into the project brief.</>
        ) : isGoogleSheetsLeadEmail ? (
          <>This n8n workflow checks new Google Sheets rows every minute, validates the lead email, and sends the row details to a configured notification address through Gmail. Invalid or missing email addresses are skipped. Before testing, set the Sheet ID, choose Google Sheets and Gmail credentials, and set the notification email. The workflow stays inactive until you enable it in n8n.</>
        ) : isWebhookIntake ? (
          isWebhookForward
            ? project.requirements.fieldMappings.length > 0
              ? <>This n8n export receives an authenticated HTTP POST, maps only the configured source paths to destination paths, forwards that JSON to a configurable API, and acknowledges after success. Missing optional fields are skipped; a missing required field stops the run before forwarding. It does not implement app-specific upsert logic. Bind the named Header Auth credential in n8n and test only with synthetic data.</>
              : <>This n8n export receives an authenticated HTTP POST, forwards its JSON body to a configurable destination API, and returns an acknowledgement after success. It is generic API forwarding; it does not perform service-specific mapping or upsert logic. Bind the named Header Auth credential, set the destination URL, and test only with synthetic data.</>
            : <>This n8n export implements authenticated HTTP POST intake and a JSON acknowledgement. It does not yet forward data to another app. Import it inactive, bind its Header Auth credential, configure the sender header, and test only with synthetic data. Keep the production URL private.</>
        ) : (
          <>This first plan is a rule-based starting point, not AI-generated or independently verified. The downloaded n8n file is an inactive scaffold that only outputs this brief and plan; it does not perform the requested automation. Review and replace its steps before using it.</>
        )}
      </div>

      <section aria-labelledby="setup-guide-title" className="mt-8 rounded-2xl border border-white/[0.1] bg-[#0a0810] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-violet-soft">After download</p>
            <h2 id="setup-guide-title" className="mt-2 font-display text-2xl tracking-tight text-mist">Set it up in n8n</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">AUTQORA prepares workflow files and guides setup. Provider credentials stay in your n8n instance; AUTQORA does not run exported workflows.</p>
          </div>
          <button type="button" disabled={downloading} onClick={() => { void downloadWorkflow(); document.getElementById("setup-guide-checklist")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.16] px-4 text-sm text-white/80 hover:bg-white/[0.06] disabled:opacity-60"><ArrowDownToLine className="h-4 w-4" /> Download again</button>
        </div>

        <ol className="mt-6 space-y-5 text-sm leading-relaxed text-white/75">
          <li><strong className="text-white">1. Import the file.</strong> In n8n, open a new workflow and use the workflow menu to import the downloaded JSON. Keep it unpublished while configuring it.</li>
          {isYoutubeVideoClips ? (
            <>
              {isClipPublishingPipeline && <li><strong className="text-white">Partial implementation.</strong> The export can clip an archived video and has opt-in YouTube and Instagram Reels upload paths. With either publishing opt-in enabled, the same n8n execution pauses at a required review form showing generated clips and start times. Select individual clips, approve all, or reject all; rejection, invalid clip numbers, or the 24-hour timeout publishes nothing. Live capture and automatic semantic moment selection are not included.</li>}
              <li><strong className="text-white">2. Start the local clip worker.</strong> Follow <a href="/video-clip-worker-setup.md" className="underline decoration-white/40 underline-offset-4">the clip-worker setup guide</a> to run the FFmpeg service on port 8090. Keep it on your own machine.</li>
              <li><strong className="text-white">3. Configure n8n access.</strong> In n8n, create a Header Auth credential named <code className="text-violet-soft">AUTQORA Clip Worker</code> with the worker API key, then select it on <code className="text-violet-soft">Create vertical clips with FFmpeg</code>. The workflow uses Docker's <code className="text-violet-soft">host.docker.internal</code> address to reach the host worker.</li>
              <li><strong className="text-white">4. Set source and clip selection.</strong> In <code className="text-violet-soft">Set clip options</code>, replace the video URL, choose 1–10 non-overlapping clips, and set a duration from 15 to 20 seconds. Select <code className="text-violet-soft">evenly_spaced</code>, <code className="text-violet-soft">scene_change</code>, or <code className="text-violet-soft">manual_timestamps</code>. For manual selection, provide one ascending, non-overlapping start time in seconds per clip in <code className="text-violet-soft">clipStartsSeconds</code>; each clip must fit in the source. Scene-change mode scores visual cuts only, not semantic highlights. Use a completed public archived video you own or have permission to process; live stream URLs are rejected until a replay is available.</li>
              <li><strong className="text-white">5. Connect YouTube (optional).</strong> Select a YouTube OAuth2 credential on <code className="text-violet-soft">Upload YouTube Short</code>. In <code className="text-violet-soft">Set clip options</code>, set the title prefix and description, then choose <code className="text-violet-soft">private</code>, <code className="text-violet-soft">unlisted</code>, or <code className="text-violet-soft">public</code> visibility. It defaults to private.</li>
              {isClipPublishingPipeline && <li><strong className="text-white">6. Connect Instagram (optional).</strong> In <code className="text-violet-soft">Set clip options</code>, set the Instagram professional account ID and caption. Create one Header Auth credential with <code>Authorization: Bearer &lt;Meta access token&gt;</code> for the Graph API nodes, and another with <code>Authorization: OAuth &lt;Meta access token&gt;</code> for the resumable upload node. The Meta app must use Facebook Login for Business with content-publishing access. <a className="underline decoration-white/40 underline-offset-4" href="https://developers.facebook.com/documentation/instagram-platform/content-publishing" target="_blank" rel="noreferrer">Meta Reels publishing requirements</a>.</li>}
              <li><strong className="text-white">{isClipPublishingPipeline ? "7" : "6"}. Create clips first.</strong> Leave <code className="text-violet-soft">publishToYouTube</code> and <code className="text-violet-soft">publishToInstagram</code> set to <code className="text-violet-soft">false</code>, run manually, then review clip framing and audio from the returned links.</li>
              <li className="rounded-lg border border-amber-200/25 bg-amber-100/[0.05] p-3 text-amber-50/85"><strong>{isClipPublishingPipeline ? "8" : "7"}. Approve before upload.</strong> Set the platform opt-in you intend to use to <code className="text-violet-soft">true</code> and run the workflow. That run creates its clips, then pauses at <code className="text-violet-soft">Review clips before publishing</code>. Open the form link from that waiting n8n execution, keep the execution-specific link private, review each listed clip, and select <code className="text-violet-soft">Approve clip 1</code> through <code className="text-violet-soft">Approve clip 10</code> as needed, <code className="text-violet-soft">Approve all clips</code>, or <code className="text-violet-soft">Reject all clips</code>. Choose only clip numbers shown on the form. Rejection or no response for 24 hours uploads nothing. YouTube uses the selected visibility and Instagram publishes Reels to the configured professional account.</li>
            </>
          ) : isInstagramPost ? (
            <>
              <li><strong className="text-white">2. Add the post details.</strong> Open <code className="text-violet-soft">Instagram post details</code>. Replace the account ID, caption and image URL. The image URL must be publicly reachable by Meta and point to a JPEG.</li>
              <li><strong className="text-white">3. Connect Meta safely.</strong> In n8n, create an HTTP Header Auth credential with header name <code className="text-violet-soft">Authorization</code> and value <code className="text-violet-soft">Bearer YOUR_INSTAGRAM_USER_ACCESS_TOKEN</code>. Select it on both HTTP Request nodes. Do not put the token in the Code node or project brief. Your Instagram account must be professional, and the Meta token needs the content publishing permission. <a className="underline decoration-white/40 underline-offset-4" href="https://developers.facebook.com/documentation/instagram-platform/content-publishing" target="_blank" rel="noreferrer">Meta setup requirements</a>.</li>
              <li><strong className="text-white">4. Review timing.</strong> The Schedule Trigger is set to daily at 9:00 AM Asia/Kolkata. Change it if that is not your intended posting time. n8n requires the workflow to be published for a schedule to run. <a className="underline decoration-white/40 underline-offset-4" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/" target="_blank" rel="noreferrer">Schedule Trigger guide</a>.</li>
              <li className="rounded-lg border border-amber-200/25 bg-amber-100/[0.05] p-3 text-amber-50/85"><strong>5. Test with care.</strong> The manual test goes all the way to Meta’s publish endpoint and can publish a real Instagram post. Verify the account, image and caption before running it. Only publish the schedule after the test succeeds.</li>
            </>
          ) : isGoogleSheetsLeadEmail ? (
            <>
              <li><strong className="text-white">2. Set the source sheet.</strong> In <code className="text-violet-soft">New lead in Google Sheet</code>, replace <code className="text-violet-soft">REPLACE_WITH_GOOGLE_SHEET_ID</code> with the ID from your Google Sheets URL and choose the correct tab name. The trigger checks for new rows every minute.</li>
              <li><strong className="text-white">3. Connect Google Sheets and Gmail.</strong> Create or select the Google Sheets OAuth2 credential on the trigger and Gmail OAuth2 credential on the send node. Select the notification recipient in <code className="text-violet-soft">Send lead notification email</code>. AUTQORA does not store account tokens.</li>
              <li><strong className="text-white">4. Match your column headings.</strong> The validation node accepts <code className="text-violet-soft">email</code>/<code className="text-violet-soft">Email</code>, <code className="text-violet-soft">name</code>/<code className="text-violet-soft">Name</code>, and optional company/source columns. Adjust the field names if your sheet uses different headings.</li>
              <li><strong className="text-white">5. Test with a safe row.</strong> Add a test lead with a valid email and confirm the notification arrives. Add a row with an invalid email and confirm the workflow follows <code className="text-violet-soft">Skip invalid or missing email</code>. Keep the workflow inactive until both cases behave as expected.</li>
            </>
          ) : isWebhookIntake ? (
            <>
              {isWebhookForward ? (
                <>
                    <li><strong className="text-white">2. Configure the destination.</strong> In <code className="text-violet-soft">Send data to {project.requirements.destinationApp}</code>, {project.requirements.destinationEndpoint ? <>review the configured endpoint <code className="break-all text-violet-soft">{project.requirements.destinationEndpoint}</code>.</> : <>replace the placeholder URL with the exact API endpoint.</>} Confirm the selected <code className="text-violet-soft">{project.requirements.destinationMethod}</code> method and request payload with the destination API documentation. {project.requirements.fieldMappings.length > 0 ? "The Map destination fields node uses your saved paths, skips missing optional values, and stops if a required source value is missing." : "This starter forwards the incoming body unchanged."}</li>
                  <li><strong className="text-white">3. Configure destination authentication.</strong> {project.requirements.destinationAuth === "none" ? "This workflow sends no destination credential. Confirm the API is intended to be public." : <>Create or select a <code className="text-violet-soft">{project.requirements.destinationAuth === "httpBasicAuth" ? "Basic Auth" : "Header Auth"}</code> credential in n8n, then bind it to <code className="text-violet-soft">Send data to {project.requirements.destinationApp}</code>. AUTQORA exports no secret.</>} <a className="underline decoration-white/40 underline-offset-4" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/" target="_blank" rel="noreferrer">HTTP Request guide</a>.</li>
                  <li><strong className="text-white">4. Bind incoming Header Auth.</strong> Create a Header Auth credential named <code className="text-violet-soft">{webhookSecretStatus?.credentialName}</code>. Set Name to <code className="text-violet-soft">{webhookSecretStatus?.headerName}</code>, paste the one-time secret as Value, then select it on <code className="text-violet-soft">Receive webhook request</code>. The exported reference name is a template; n8n assigns the real credential ID. Give the same header and value to the sending service.</li>
                  <li><strong className="text-white">5. Test before publishing.</strong> Use the Test URL with a synthetic request and the exact header. A missing or incorrect value is rejected before the workflow starts. Confirm the destination returns 2xx before the workflow acknowledges. n8n strips the consumed auth header from the workflow input. <a className="underline decoration-white/40 underline-offset-4" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" rel="noreferrer">Webhook guide</a>.</li>
                  <li><strong className="text-white">6. Publish carefully.</strong> Use the Production URL only after publishing the workflow. Review successful and failed executions; confirm retries cannot create duplicate records before connecting a real sender.</li>
                </>
              ) : (
                <>
                  <li><strong className="text-white">2. Bind incoming Header Auth.</strong> Create a Header Auth credential named <code className="text-violet-soft">{webhookSecretStatus?.credentialName}</code>. Set Name to <code className="text-violet-soft">{webhookSecretStatus?.headerName}</code>, paste the one-time secret as Value, then select it on <code className="text-violet-soft">Receive webhook request</code>. The exported reference name is a template; n8n assigns the real credential ID. Configure the sender to send that exact header name and value.</li>
                  <li><strong className="text-white">3. Test the protected endpoint.</strong> Select <em>Listen for test event</em> and send a POST with synthetic JSON and the header. Missing or incorrect values should be rejected before a workflow execution starts. The response returns <code className="text-violet-soft">received: true</code> for authorized requests. <a className="underline decoration-white/40 underline-offset-4" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" rel="noreferrer">n8n Webhook guide</a>.</li>
                  <li><strong className="text-white">4. Add the intended work.</strong> The current response only acknowledges and echoes the incoming data. Add mapping, validation, and destination actions before using it for a real business process.</li>
                  <li><strong className="text-white">5. Publish carefully.</strong> Use the Production URL only after publishing the workflow. Test with synthetic data and inspect the execution in n8n before connecting a real sender. <a className="underline decoration-white/40 underline-offset-4" href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/" target="_blank" rel="noreferrer">Respond to Webhook guide</a>.</li>
                </>
              )}
            </>
          ) : (
            <>
              <li><strong className="text-white">2. Review the scaffold.</strong> Replace its sample values and implement the real trigger/actions. This generic export is a starter scaffold, not an automation tailored to another service.</li>
              <li><strong className="text-white">3. Add credentials in n8n.</strong> Use n8n credentials for the target service. Keep passwords, tokens and private data out of AUTQORA project briefs and exported workflow files.</li>
              <li><strong className="text-white">4. Test before enabling.</strong> Run with safe sample data, inspect each node output, then publish/activate only when the workflow does what you expect.</li>
              <li><strong className="text-white">5. Track your setup.</strong> Mark each item below as you complete it. Progress is saved with this project.</li>
            </>
          )}
        </ol>

        <div id="setup-guide-checklist" className="mt-6 border-t border-white/[0.08] pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-white">Setup checklist</h3>
            <span className="text-xs text-white/55">{setupChecks ? Object.values(setupChecks).filter(Boolean).length : 0} / 5 complete · saved to this project</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {([
              ["workflow_imported", "Imported the downloaded workflow into n8n"],
              ["fields_configured", isYoutubeVideoClips ? isClipPublishingPipeline ? "Set source, clip selection, YouTube metadata/visibility, and Instagram account/caption" : "Set source, clip selection, and optional YouTube title/description/visibility" : isInstagramPost ? "Filled in the account, image and caption details" : isGoogleSheetsLeadEmail ? "Set the sheet ID, tab and notification address" : isWebhookForward ? "Set destination URL and reviewed the field mappings" : isWebhookIntake ? "Reviewed the webhook path and JSON response" : "Configured the workflow inputs and actions"],
              ["credentials_connected", isYoutubeVideoClips ? isClipPublishingPipeline ? "Selected worker, YouTube OAuth2 (optional), and both Meta Header Auth credentials if publishing Reels" : "Selected the clip-worker credential and YouTube OAuth2 if uploading" : isInstagramPost ? "Selected the right credential on both request nodes" : isGoogleSheetsLeadEmail ? "Selected Google Sheets and Gmail credentials" : isWebhookForward ? `${project.requirements.destinationAuth === "none" ? "Confirmed the destination is intentionally public" : `Selected the destination ${project.requirements.destinationAuth === "httpBasicAuth" ? "Basic Auth" : "Header Auth"} credential`} and bound incoming Header Auth` : isWebhookIntake ? "Bound incoming Header Auth and configured the sender header" : "Added required credentials in n8n"],
              ["schedule_checked", isYoutubeVideoClips ? "Confirmed manual execution and worker address" : isInstagramPost ? "Checked the schedule and timezone" : isGoogleSheetsLeadEmail ? "Confirmed the one-minute trigger polling" : isWebhookIntake ? "Tested the endpoint and reviewed its response" : "Checked the trigger and runtime settings"],
              ["test_reviewed", isYoutubeVideoClips ? isClipPublishingPipeline ? "Reviewed a prior run's clips before enabling either upload opt-in" : "Reviewed local clips before enabling the YouTube upload opt-in" : isInstagramPost ? "Reviewed that a manual test may publish a real post" : "Reviewed the test data and expected outcome"],
            ] as const).map(([key, label]) => (
              <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/[0.07] px-3 py-2 text-xs leading-relaxed text-white/70 hover:bg-white/[0.03]">
                <input type="checkbox" checked={setupChecks?.[key] ?? false} disabled={!setupChecks || setupSaving} onChange={() => void toggleSetupCheck(key)} className="peer sr-only" />
                <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/30 text-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-violet-soft peer-checked:border-violet-soft peer-checked:bg-violet-soft peer-checked:text-ink"><Check className="h-3 w-3" /></span>
                {label}
              </label>
            ))}
          </div>
          {setupSaving && <p role="status" className="mt-3 text-xs text-white/50">Saving progress…</p>}
          {setupError && <p role="alert" className="mt-3 text-xs text-[#f58ba0]">{setupError}</p>}
        </div>
      </section>

      <ToolRecommendationPanel projectId={projectId} />

      <ProjectDebugger projectId={projectId} initialPlatform={project.platform} />

      <form onSubmit={savePlan} className="mt-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl text-mist">Editable implementation plan</h2><div className="flex flex-wrap gap-2"><button type="button" disabled={aiPlanning || regenerating} onClick={() => void draftAiPlan()} className="inline-flex h-9 items-center gap-2 rounded-full border border-violet-soft/35 px-3 text-xs text-white/80 hover:bg-violet/[0.1] disabled:opacity-50">{aiPlanning && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{aiPlanning ? "Drafting with AI" : "Draft with AI"}</button><button type="button" disabled={regenerating || aiPlanning} onClick={() => void regeneratePlan()} className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.14] px-3 text-xs text-white/75 hover:bg-white/[0.05] disabled:opacity-50">{regenerating && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{regenerating ? "Regenerating" : "Regenerate from requirements"}</button></div></div>
        <p className="-mt-3 text-xs leading-relaxed text-white/45">AI drafting sends this project brief and saved requirements to OpenAI only when you click the button. Keep credentials, tokens, and personal data out of the brief.</p>
        {aiPlanError && <p role="status" className="rounded-lg border border-violet-soft/15 bg-violet/[0.04] px-3 py-2.5 text-sm text-white/70">{aiPlanError}</p>}
        <div><label className={labelClass} htmlFor="plan-objective">Objective</label><textarea id="plan-objective" required minLength={10} maxLength={2000} rows={3} value={fields.objective} onChange={(event) => update("objective", event.target.value)} className={inputClass} /></div>
        <div><label className={labelClass} htmlFor="plan-trigger">Trigger</label><textarea id="plan-trigger" required minLength={3} maxLength={1000} rows={2} value={fields.trigger} onChange={(event) => update("trigger", event.target.value)} className={inputClass} /></div>
        <div>
          <label className={labelClass} htmlFor="plan-steps">Implementation steps <span className="font-normal text-white/50">(one step per line)</span></label>
          <textarea id="plan-steps" required rows={7} value={fields.implementationSteps} onChange={(event) => update("implementationSteps", event.target.value)} className={inputClass} />
        </div>
        <div><label className={labelClass} htmlFor="plan-assumptions">Assumptions and decisions to confirm</label><textarea id="plan-assumptions" maxLength={2000} rows={4} value={fields.assumptions} onChange={(event) => update("assumptions", event.target.value)} className={inputClass} /></div>
        <div>
          <label className={labelClass} htmlFor="plan-checks">Verification checks <span className="font-normal text-white/50">(one check per line)</span></label>
          <textarea id="plan-checks" required rows={6} value={fields.verificationChecks} onChange={(event) => update("verificationChecks", event.target.value)} className={inputClass} />
        </div>
        {error && <p role="alert" className="rounded-lg border border-[#f0567a]/20 bg-[#f0567a]/[0.05] px-3 py-2.5 text-sm text-[#f58ba0]">{error}</p>}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mist px-6 text-sm font-medium text-ink transition-colors hover:bg-white disabled:opacity-60">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving plan" : "Save plan"}
          </button>
          {saved && <span role="status" className="text-sm text-emerald-200">Saved as revision {revision}.</span>}
        </div>
      </form>
    </div>
  );
}
