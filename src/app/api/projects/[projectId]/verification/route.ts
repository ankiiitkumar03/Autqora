import { getLatestWorkflowArtifact, getProject, getWorkflowArtifact, getWorkspaceId, listManualWorkflowEvidence, listN8nExecutionEvidence, listWorkflowArtifacts, listWorkflowVerifications, saveManualWorkflowEvidence, saveN8nExecutionEvidence, saveWorkflowVerification } from "@/lib/project-store";
import { manualWorkflowTestEvidenceSchema } from "@/lib/project-domain";
import { reviewN8nExecution } from "@/lib/execution-evidence";
import { isSameOriginMutation } from "@/lib/request-security";
import { redactSecrets } from "@/lib/debug-diagnostics";
import { verifyN8nWorkflow } from "@/lib/project-workflow";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };
const manualEvidenceRequestSchema = z.object({ action: z.literal("record_manual_test"), evidence: manualWorkflowTestEvidenceSchema }).strict();
const n8nExecutionRequestSchema = z.object({ action: z.literal("review_n8n_execution"), artifactId: z.string().uuid(), execution: z.unknown() }).strict();

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  return Response.json({ reports: listWorkflowVerifications(workspaceId, projectId), manualEvidence: listManualWorkflowEvidence(workspaceId, projectId), executionEvidence: listN8nExecutionEvidence(workspaceId, projectId) }, { headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });

  if (request.body) {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 512_000) return Response.json({ error: "Keep the verification request under 512 KB." }, { status: 413, headers });
    let body: unknown;
    let raw = "";
    try {
      raw = await request.text();
      if (raw.length > 512_000) return Response.json({ error: "Keep the verification request under 512 KB." }, { status: 413, headers });
      body = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Send valid JSON verification evidence." }, { status: 400, headers });
    }
    if (body && typeof body === "object" && !Array.isArray(body) && (body as { action?: unknown }).action === "review_n8n_execution") {
      const parsedExecution = n8nExecutionRequestSchema.safeParse(body);
      if (!parsedExecution.success) return Response.json({ error: "Select a saved workflow version and provide a valid n8n execution JSON object." }, { status: 400, headers });
      if (JSON.stringify(parsedExecution.data.execution).length > 256_000) return Response.json({ error: "Keep imported execution JSON under 256 KB." }, { status: 413, headers });
      const artifact = listWorkflowArtifacts(workspaceId, projectId).find((item) => item.id === parsedExecution.data.artifactId);
      if (!artifact || !getWorkflowArtifact(workspaceId, projectId, artifact.id)) return Response.json({ error: "Workflow version not found." }, { status: 404, headers });
      const review = reviewN8nExecution(parsedExecution.data.execution);
      if (!review) return Response.json({ error: "This JSON does not include a supported n8n execution status or resultData.runData." }, { status: 400, headers });
      try {
        const evidence = saveN8nExecutionEvidence(workspaceId, projectId, artifact.id, artifact.version, review);
        if (!evidence) throw new Error("Saved execution evidence could not be loaded.");
        return Response.json({ executionEvidence: evidence, provenance: "user_supplied_n8n_execution_json" }, { status: 201, headers });
      } catch {
        return Response.json({ error: "Could not save the execution review." }, { status: 500, headers });
      }
    }
    if (raw.length > 4_096) return Response.json({ error: "Keep manual test evidence under 4 KB." }, { status: 413, headers });
    const parsed = manualEvidenceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Provide a result, environment, and a short test summary." }, { status: 400, headers });
    }
    const latestArtifact = getLatestWorkflowArtifact(workspaceId, projectId);
    if (!latestArtifact) return Response.json({ error: "Generate a workflow version before recording a manual test." }, { status: 409, headers });
    const evidence = {
      ...parsed.data.evidence,
      summary: redactSecrets(parsed.data.evidence.summary),
      executionReference: redactSecrets(parsed.data.evidence.executionReference),
    };
    try {
      const report = saveManualWorkflowEvidence(workspaceId, projectId, latestArtifact.artifact.id, latestArtifact.artifact.version, evidence);
      return Response.json({ manualEvidence: report }, { status: 201, headers });
    } catch {
      return Response.json({ error: "Could not save manual test evidence." }, { status: 500, headers });
    }
  }

  const latest = getLatestWorkflowArtifact(workspaceId, projectId);
  if (!latest) return Response.json({ error: "Generate and download a workflow version before running checks." }, { status: 409, headers });
  const result = verifyN8nWorkflow(latest.workflow, latest.artifact.scenario);
  const report = saveWorkflowVerification(workspaceId, projectId, latest.artifact.id, latest.artifact.version, result.status, result.checks);
  return Response.json({ report }, { headers });
}
