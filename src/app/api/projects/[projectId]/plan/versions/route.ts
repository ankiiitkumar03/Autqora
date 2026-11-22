import { getProject, getWorkspaceId, listProjectPlanVersions } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ versions: listProjectPlanVersions(workspaceId, projectId) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
