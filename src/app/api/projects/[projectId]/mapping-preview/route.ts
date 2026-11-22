import { z } from "zod";
import { getProject, getProjectRequirements, getWorkspaceId } from "@/lib/project-store";
import { previewWebhookMapping } from "@/lib/webhook-mapping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, no-cache, max-age=0", "X-Content-Type-Options": "nosniff" };
const previewRequestSchema = z.object({ payload: z.record(z.string(), z.unknown()) }).strict();

function exceedsJsonDepth(value: unknown, limit = 64) {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  while (pending.length) {
    const current = pending.pop()!;
    if (current.depth > limit) return true;
    if (!current.value || typeof current.value !== "object") continue;
    for (const child of Object.values(current.value)) pending.push({ value: child, depth: current.depth + 1 });
  }
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });

  if (Number(request.headers.get("content-length") ?? 0) > 32_768) return Response.json({ error: "Keep the synthetic payload under 32 KB." }, { status: 413, headers });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 32_768) return Response.json({ error: "Keep the synthetic payload under 32 KB." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Send valid JSON with a payload object." }, { status: 400, headers });
  }

  if (exceedsJsonDepth(body)) return Response.json({ error: "Keep the sample JSON nesting under 64 levels." }, { status: 400, headers });
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Payload must be a JSON object." }, { status: 400, headers });
  const mappings = getProjectRequirements(workspaceId, projectId).fieldMappings;
  if (mappings.length === 0) return Response.json({ error: "Save at least one field mapping before previewing." }, { status: 409, headers });

  const preview = previewWebhookMapping({ body: parsed.data.payload }, mappings);
  if (preview.missingRequiredPaths.length) {
    return Response.json({ error: "Required source fields are missing; forwarding would stop in n8n.", missingRequiredPaths: preview.missingRequiredPaths }, { status: 422, headers });
  }
  if (JSON.stringify(preview.mappedPayload).length > 65_536) {
    return Response.json({ error: "The mapped result is too large to preview. Use a smaller synthetic payload." }, { status: 422, headers });
  }
  return Response.json({ ...preview, status: "preview_only", persisted: false }, { headers });
}
