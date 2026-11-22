import { z } from "zod";
import { redactSecrets } from "@/lib/debug-diagnostics";
import { isSameOriginMutation } from "@/lib/request-security";
import { getProject, getWorkspaceId, updateProjectDebugStepFeedback } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const schema = z.object({
  status: z.enum(["not_started", "tried", "resolved", "still_failing", "not_applicable"]),
  note: z.string().trim().max(500).optional().default(""),
}).strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; reportId: string; stepIndex: string }> },
) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId, reportId, stepIndex: rawStepIndex } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  if (!/^\d{1,2}$/.test(rawStepIndex)) return Response.json({ error: "Recommendation step was not found." }, { status: 404, headers });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_048) return Response.json({ error: "Keep the request under 2 KB." }, { status: 413, headers });

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2_048) return Response.json({ error: "Keep the request under 2 KB." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Send valid JSON with a status and optional outcome note." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Choose a valid step outcome and keep the optional note under 500 characters." }, { status: 400, headers });

  const report = updateProjectDebugStepFeedback(
    workspaceId,
    projectId,
    reportId,
    Number(rawStepIndex),
    parsed.data.status,
    redactSecrets(parsed.data.note).slice(0, 500),
  );
  if (!report) return Response.json({ error: "Debug report or recommendation step was not found." }, { status: 404, headers });
  return Response.json({ report }, { headers });
}
