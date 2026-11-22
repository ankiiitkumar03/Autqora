import { projectCreateSchema } from "@/lib/project-domain";
import { isSameOriginMutation } from "@/lib/request-security";
import {
  createProject,
  createWorkspaceId,
  getWorkspaceId,
  listProjects,
  ProjectLimitError,
  workspaceCookie,
} from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
const maxBodyLength = 8_192;

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId(request);
  return Response.json({ projects: workspaceId ? listProjects(workspaceId) : [] }, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers: noStoreHeaders });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBodyLength) {
    return Response.json({ error: "Project brief is too large." }, { status: 413, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > maxBodyLength) {
      return Response.json({ error: "Project brief is too large." }, { status: 413, headers: noStoreHeaders });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Send a valid JSON project brief." }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Add a project name (2–100 characters) and goal (10–4,000 characters)." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const existingWorkspaceId = getWorkspaceId(request);
  const workspaceId = existingWorkspaceId ?? createWorkspaceId();

  try {
    const project = createProject(workspaceId, parsed.data);
    const headers = new Headers(noStoreHeaders);
    if (!existingWorkspaceId) headers.set("Set-Cookie", workspaceCookie(workspaceId));
    return Response.json({ project }, { status: 201, headers });
  } catch (error) {
    if (error instanceof ProjectLimitError) return Response.json({ error: error.message }, { status: 409, headers: noStoreHeaders });
    return Response.json({ error: "Could not save the project. Please try again." }, { status: 500, headers: noStoreHeaders });
  }
}
