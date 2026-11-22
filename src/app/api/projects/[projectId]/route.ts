import { projectUpdateSchema } from "@/lib/project-domain";
import { isSameOriginMutation } from "@/lib/request-security";
import { deleteProject, getProject, getWorkspaceId, updateProject } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
const projectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId && projectIdPattern.test(projectId) ? getProject(workspaceId, projectId) : null;
  return project
    ? Response.json({ project }, { headers: noStoreHeaders })
    : Response.json({ error: "Project not found." }, { status: 404, headers: noStoreHeaders });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers: noStoreHeaders });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !projectIdPattern.test(projectId)) {
    return Response.json({ error: "Project not found." }, { status: 404, headers: noStoreHeaders });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 8_192) {
    return Response.json({ error: "Project update is too large." }, { status: 413, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 8_192) {
      return Response.json({ error: "Project update is too large." }, { status: 413, headers: noStoreHeaders });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Send a valid JSON project update." }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "The project update is invalid." }, { status: 400, headers: noStoreHeaders });
  }

  const project = updateProject(workspaceId, projectId, parsed.data);
  return project
    ? Response.json({ project }, { headers: noStoreHeaders })
    : Response.json({ error: "Project not found." }, { status: 404, headers: noStoreHeaders });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers: noStoreHeaders });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const deleted = workspaceId && projectIdPattern.test(projectId) && deleteProject(workspaceId, projectId);
  return deleted
    ? new Response(null, { status: 204, headers: noStoreHeaders })
    : Response.json({ error: "Project not found." }, { status: 404, headers: noStoreHeaders });
}
