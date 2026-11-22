import { createHash, randomBytes } from "node:crypto";
import { consumeAuthRateLimit, getProject, getProjectWebhookSecretStatus, getWorkspaceId, rotateProjectWebhookSecret } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  return Response.json({ status: getProjectWebhookSecretStatus(workspaceId, projectId) }, { headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let originHost: string | null = null;
  if (origin) {
    try { originHost = new URL(origin).host; } catch { originHost = null; }
  }
  if ((origin && (!originHost || originHost !== host)) || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "This request must come from the AUTQORA project page." }, { status: 403, headers });
  }
  if (request.body || Number(request.headers.get("content-length") ?? 0) > 0) return Response.json({ error: "This endpoint does not accept a request body." }, { status: 400, headers });

  const limit = consumeAuthRateLimit(`webhook-secret:${workspaceId}:${projectId}`, 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json({ error: "Secret generation is temporarily rate limited. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  }

  const secret = randomBytes(32).toString("base64url");
  const secretHash = createHash("sha256").update(secret, "utf8").digest("hex");
  try {
    const status = rotateProjectWebhookSecret(workspaceId, projectId, secretHash);
    return Response.json({ secret, status: { ...status, configured: true } }, { status: 201, headers });
  } catch {
    return Response.json({ error: "Could not save the webhook secret. No secret was issued." }, { status: 500, headers });
  }
}
