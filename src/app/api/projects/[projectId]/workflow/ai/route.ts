import { AiWorkflowError, draftN8nWorkflowWithAi } from "@/lib/ai-workflow";
import { identifyOpenProjectQuestions, draftProjectPlan } from "@/lib/project-planning";
import { getProject, getProjectPlan, getProjectWorkflowSourceFingerprint, getWorkspaceId, consumeAuthRateLimit } from "@/lib/project-store";
import { isSameOriginMutation } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers });
  if (request.body || Number(request.headers.get("content-length") ?? 0) > 0) return Response.json({ error: "This endpoint does not accept a request body." }, { status: 400, headers });

  const limit = consumeAuthRateLimit(`ai-workflow:${workspaceId}:${projectId}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) return Response.json({ error: "AI workflow drafting is temporarily rate limited. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const sourceFingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
    if (!sourceFingerprint) return Response.json({ error: "Project not found." }, { status: 404, headers });
    const plan = getProjectPlan(workspaceId, projectId) ?? draftProjectPlan(project);
    const draft = await draftN8nWorkflowWithAi(project, plan);
    if (getProjectWorkflowSourceFingerprint(workspaceId, projectId) !== sourceFingerprint) return Response.json({ error: "Project requirements or plan changed while the AI draft was being prepared. Try again." }, { status: 409, headers });
    return Response.json({
      ...draft,
      scenario: "ai_generated_n8n",
      sourceFingerprint,
      openQuestions: identifyOpenProjectQuestions(project),
    }, { headers });
  } catch (error) {
    if (error instanceof AiWorkflowError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: "Could not draft an AI workflow. Try again later." }, { status: 502, headers });
  }
}
