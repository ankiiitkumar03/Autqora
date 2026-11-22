import {
  getProject,
  getProjectSetup,
  getProjectSetupUpdatedAt,
  getWorkspaceId,
  listManualWorkflowEvidence,
  listN8nExecutionEvidence,
  listProjectDebugReports,
  listProjectPlanVersions,
  listWorkflowArtifacts,
  listWorkflowVerifications,
} from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
type ActivityItem = { id: string; occurredAt: string; category: "project" | "plan" | "workflow" | "setup" | "verification" | "evidence" | "debug"; title: string; detail: string };

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers });

  const items: ActivityItem[] = [{
    id: `project-created-${project.id}`,
    occurredAt: project.createdAt,
    category: "project",
    title: "Project brief saved",
    detail: project.name,
  }];
  if (project.updatedAt > project.createdAt) items.push({
    id: `project-updated-${project.id}`,
    occurredAt: project.updatedAt,
    category: "project",
    title: "Project details last updated",
    detail: `Current stage: ${project.status.replaceAll("_", " ")}`,
  });
  for (const plan of listProjectPlanVersions(workspaceId, projectId)) items.push({
    id: `plan-${plan.revision}`,
    occurredAt: plan.updatedAt,
    category: "plan",
    title: `Plan revision ${plan.revision} saved`,
    detail: plan.objective,
  });
  for (const artifact of listWorkflowArtifacts(workspaceId, projectId)) items.push({
    id: `workflow-${artifact.id}`,
    occurredAt: artifact.createdAt,
    category: "workflow",
    title: `Workflow version ${artifact.version} saved`,
    detail: `${artifact.name} · source context ${artifact.sourceStatus}`,
  });
  const setupUpdatedAt = getProjectSetupUpdatedAt(workspaceId, projectId);
  if (setupUpdatedAt) {
    const checks = getProjectSetup(workspaceId, projectId);
    items.push({
      id: `setup-${projectId}-${setupUpdatedAt}`,
      occurredAt: setupUpdatedAt,
      category: "setup",
      title: "Setup checklist updated",
      detail: `${Object.values(checks).filter(Boolean).length} of ${Object.keys(checks).length} steps marked complete by the user`,
    });
  }
  for (const report of listWorkflowVerifications(workspaceId, projectId)) items.push({
    id: `verification-${report.id}`,
    occurredAt: report.createdAt,
    category: "verification",
    title: `Local checks for workflow version ${report.artifactVersion}`,
    detail: report.status === "ready_for_manual_test" ? "Saved JSON passed local checks; n8n execution was not verified." : "Saved JSON still needs setup or changes.",
  });
  for (const evidence of listManualWorkflowEvidence(workspaceId, projectId)) items.push({
    id: `manual-evidence-${evidence.id}`,
    occurredAt: evidence.reportedAt,
    category: "evidence",
    title: `User-reported test ${evidence.result} · workflow v${evidence.artifactVersion}`,
    detail: evidence.summary,
  });
  for (const evidence of listN8nExecutionEvidence(workspaceId, projectId)) items.push({
    id: `execution-evidence-${evidence.id}`,
    occurredAt: evidence.reportedAt,
    category: "evidence",
    title: `User-supplied n8n summary · ${evidence.reportedStatus} · workflow v${evidence.artifactVersion}`,
    detail: evidence.failedNodes.length ? `Reported failed nodes: ${evidence.failedNodes.join(", ")}` : `${evidence.nodeNames.length} node name(s) recorded; AUTQORA did not authenticate the source.`,
  });
  for (const report of listProjectDebugReports(workspaceId, projectId)) items.push({
    id: `debug-${report.id}`,
    occurredAt: report.createdAt,
    category: "debug",
    title: `Debug analysis · ${report.diagnosis.category}`,
    detail: report.diagnosis.summary,
  });

  items.sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  return Response.json({ items: items.slice(0, 100), note: "Activity is assembled from saved project records. It is not a security audit log or proof of external workflow execution." }, { headers });
}
