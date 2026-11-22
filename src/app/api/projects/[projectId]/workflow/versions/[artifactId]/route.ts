import { getProject, getWorkflowArtifact, getWorkspaceId, listWorkflowArtifacts } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string; artifactId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId, artifactId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const metadata = listWorkflowArtifacts(workspaceId, projectId).find((item) => item.id === artifactId);
  const workflow = getWorkflowArtifact(workspaceId, projectId, artifactId);
  if (!metadata || !workflow) return Response.json({ error: "Workflow version not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const safeName = metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "workflow";
  return new Response(JSON.stringify(workflow, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-v${metadata.version}.json"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
