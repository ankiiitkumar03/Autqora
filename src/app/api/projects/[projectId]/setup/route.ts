import { projectSetupSchema } from "@/lib/project-domain";
import { isSameOriginMutation } from "@/lib/request-security";
import { getProject, getProjectSetup, getWorkspaceId, saveProjectSetup } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

async function readChecks(request: Request) {
  const raw = await request.text();
  if (raw.length > 4_096) return { error: "Setup checklist payload is too large.", status: 413 } as const;
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return { error: "Send a valid JSON checklist.", status: 400 } as const; }
  const parsed = projectSetupSchema.safeParse(body);
  if (!parsed.success) return { error: "Checklist values must be true or false.", status: 400 } as const;
  return { checks: parsed.data.checks } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  return Response.json({ checks: getProjectSetup(workspaceId, projectId) }, { headers });
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const parsed = await readChecks(request);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: parsed.status, headers });
  return Response.json({ checks: saveProjectSetup(workspaceId, projectId, parsed.checks) }, { headers });
}
