import { getProject, getProjectPlan, getProjectPlanFreshness, getProjectSetup, getProjectWebhookSecretStatus, getWorkflowArtifact, getWorkspaceId, listManualWorkflowEvidence, listN8nExecutionEvidence, listProjectDebugReports, listProjectPlanVersions, listWorkflowArtifacts, listWorkflowVerifications } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const maxExportBytes = 20 * 1024 * 1024;

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers });

  const workflowVersions = listWorkflowArtifacts(workspaceId, projectId).flatMap((artifact) => {
    const workflow = getWorkflowArtifact(workspaceId, projectId, artifact.id);
    return workflow ? [{ artifact, workflow }] : [];
  });
  const backup = {
    format: "autqora-project-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    plan: getProjectPlan(workspaceId, projectId),
    planFreshness: getProjectPlanFreshness(workspaceId, projectId),
    planHistory: listProjectPlanVersions(workspaceId, projectId),
    setup: getProjectSetup(workspaceId, projectId),
    workflowVersions,
    verificationReports: listWorkflowVerifications(workspaceId, projectId),
    manualTestEvidence: listManualWorkflowEvidence(workspaceId, projectId),
    importedExecutionSummaries: listN8nExecutionEvidence(workspaceId, projectId),
    debugReports: listProjectDebugReports(workspaceId, projectId),
    webhookSecurityStatus: getProjectWebhookSecretStatus(workspaceId, projectId),
    securityNote: "This backup contains no webhook secret value or secret hash. Imported execution evidence is user supplied and not authenticated by n8n.",
  };
  const json = JSON.stringify(backup, null, 2);
  if (Buffer.byteLength(json, "utf8") > maxExportBytes) {
    return Response.json({ error: "This project backup exceeds 20 MB. Download individual workflow versions from the project history." }, { status: 413, headers });
  }
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project";
  return new Response(json, {
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="autqora-${slug}-backup.json"`,
    },
  });
}
