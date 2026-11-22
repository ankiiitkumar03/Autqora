import { AiPlanningError, draftPlanWithAi } from "@/lib/ai-planning";
import { getProject, getWorkspaceId, consumeAuthRateLimit } from "@/lib/project-store";
import { isSameOriginMutation } from "@/lib/request-security";
import { identifyOpenProjectQuestions } from "@/lib/project-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers });
  if (request.body || Number(request.headers.get("content-length") ?? 0) > 0) return Response.json({ error: "This endpoint does not accept a request body." }, { status: 400, headers });

  const limit = consumeAuthRateLimit(`ai-plan:${workspaceId}:${projectId}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return Response.json({ error: "AI plan drafting is temporarily rate limited. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  try {
    const draft = await draftPlanWithAi(project);
    return Response.json({ draft, source: "openai", openQuestions: identifyOpenProjectQuestions(project), note: "Review this AI-generated draft and its assumptions before saving or implementing it." }, { headers });
  } catch (error) {
    if (error instanceof AiPlanningError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: "Could not draft an AI plan. Try again later." }, { status: 502, headers });
  }
}
