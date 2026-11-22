import { getProject, getWorkspaceId } from "@/lib/project-store";
import { recommendTools } from "@/lib/tool-recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ recommendations: recommendTools(project), basis: "Explainable rules from the saved brief and selected platform; not AI or live pricing." }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
