import { projectPlanSchema } from "@/lib/project-domain";
import type { ProjectPlan } from "@/lib/project-domain";
import { draftProjectPlan, identifyOpenProjectQuestions } from "@/lib/project-planning";
import { isSameOriginMutation } from "@/lib/request-security";
import { createProjectPlan, getProject, getProjectPlan, getProjectPlanFreshness, getWorkspaceId, updateProjectPlan } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };
const maxBodyLength = 16_384;

async function readInput(request: Request) {
  const raw = await request.text();
  if (raw.length > maxBodyLength) return { error: "Plan is too large.", status: 413 } as const;
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return { error: "Send a valid JSON plan.", status: 400 } as const; }
  const parsed = projectPlanSchema.safeParse(body);
  if (!parsed.success) return { error: "Check the plan fields and try again.", status: 400 } as const;
  return { data: parsed.data } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const project = getProject(workspaceId, projectId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404, headers });

  const plan: ProjectPlan = getProjectPlan(workspaceId, projectId) ?? {
    projectId,
    ...draftProjectPlan(project),
    revision: 0,
    updatedAt: "",
  };
  return Response.json({ plan, project, freshness: getProjectPlanFreshness(workspaceId, projectId), openQuestions: identifyOpenProjectQuestions(project) }, { headers });
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers });

  const parsed = await readInput(request);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: parsed.status, headers });

  let plan = getProjectPlan(workspaceId, projectId);
  if (!plan) plan = createProjectPlan(workspaceId, projectId, parsed.data);
  else plan = updateProjectPlan(workspaceId, projectId, parsed.data);
  return Response.json({ plan, freshness: getProjectPlanFreshness(workspaceId, projectId), openQuestions: identifyOpenProjectQuestions(project) }, { headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const project = getProject(workspaceId, projectId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const generated = draftProjectPlan(project);
  const current = getProjectPlan(workspaceId, projectId);
  const plan = current ? updateProjectPlan(workspaceId, projectId, generated) : createProjectPlan(workspaceId, projectId, generated);
  return Response.json({ plan, freshness: getProjectPlanFreshness(workspaceId, projectId), openQuestions: identifyOpenProjectQuestions(project), source: "rules", note: "Starter plan regenerated from saved requirements. Review assumptions before implementation." }, { headers });
}
