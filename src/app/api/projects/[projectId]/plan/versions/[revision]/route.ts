import { getProject, getProjectPlanFreshness, getProjectPlanVersion, getWorkspaceId, updateProjectPlan } from "@/lib/project-store";
import { isSameOriginMutation } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string; revision: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const workspaceId = getWorkspaceId(request);
  const { projectId, revision: rawRevision } = await params;
  const revision = Number(rawRevision);
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!Number.isSafeInteger(revision) || revision < 1) return Response.json({ error: "Plan revision not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const snapshot = getProjectPlanVersion(workspaceId, projectId, revision);
  if (!snapshot) return Response.json({ error: "Plan revision not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const plan = updateProjectPlan(workspaceId, projectId, snapshot);
  if (!plan) return Response.json({ error: "Project plan not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ plan, freshness: getProjectPlanFreshness(workspaceId, projectId), restoredFrom: revision }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
