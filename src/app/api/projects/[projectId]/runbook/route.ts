import { buildDeploymentRunbook } from "@/lib/deployment-runbook";
import { identifyOpenProjectQuestions } from "@/lib/project-planning";
import { getLatestWorkflowArtifact, getProject, getProjectPlan, getProjectPlanFreshness, getProjectSetup, getProjectWebhookSecretStatus, getWorkspaceId, listManualWorkflowEvidence, listN8nExecutionEvidence, listWorkflowVerifications } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const latest = getLatestWorkflowArtifact(workspaceId, projectId);
  const verification = latest ? listWorkflowVerifications(workspaceId, projectId).find((report) => report.artifactId === latest.artifact.id) ?? null : null;
  const executionEvidence = latest ? listN8nExecutionEvidence(workspaceId, projectId).find((item) => item.artifactId === latest.artifact.id) ?? null : null;
  const runbook = buildDeploymentRunbook(
    project,
    getProjectPlan(workspaceId, projectId),
    getProjectSetup(workspaceId, projectId),
    listManualWorkflowEvidence(workspaceId, projectId),
    getProjectWebhookSecretStatus(workspaceId, projectId),
    latest?.artifact ?? null,
    verification,
    executionEvidence,
    getProjectPlanFreshness(workspaceId, projectId),
    identifyOpenProjectQuestions(project),
  );
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project";
  return new Response(runbook, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="autqora-${slug}-runbook.md"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
