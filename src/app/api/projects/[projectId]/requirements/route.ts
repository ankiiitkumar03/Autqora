import { projectRequirementsSchema } from "@/lib/project-domain";
import { isSameOriginMutation } from "@/lib/request-security";
import { getProject, getProjectRequirements, getWorkspaceId, saveProjectRequirements } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  return Response.json({ requirements: getProjectRequirements(workspaceId, projectId) }, { headers });
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4_096) return Response.json({ error: "Requirements are too large." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Send valid JSON requirements." }, { status: 400, headers });
  }
  const parsed = projectRequirementsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the requirement fields and try again." }, { status: 400, headers });
  return Response.json({ requirements: saveProjectRequirements(workspaceId, projectId, parsed.data) }, { headers });
}
