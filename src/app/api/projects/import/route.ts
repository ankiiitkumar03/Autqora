import { backupContainsCredentialMaterial, projectBackupImportSchema } from "@/lib/project-backup";
import { isSameOriginMutation } from "@/lib/request-security";
import { createWorkspaceId, getWorkspaceId, importProjectBackup, ProjectLimitError, workspaceCookie } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const maxBackupBytes = 20 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBackupBytes) return Response.json({ error: "Project backup exceeds the 20 MB import limit." }, { status: 413, headers });

  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxBackupBytes) return Response.json({ error: "Project backup exceeds the 20 MB import limit." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Choose a valid AUTQORA project backup JSON file." }, { status: 400, headers });
  }

  const parsed = projectBackupImportSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "This backup is not valid or is from an unsupported AUTQORA backup version." }, { status: 400, headers });
  if (backupContainsCredentialMaterial(parsed.data)) return Response.json({ error: "This backup appears to contain credentials. Remove tokens, passwords, and API keys before importing it." }, { status: 400, headers });

  const existingWorkspaceId = getWorkspaceId(request);
  const workspaceId = existingWorkspaceId ?? createWorkspaceId();
  try {
    const result = importProjectBackup(workspaceId, parsed.data);
    const responseHeaders = new Headers(headers);
    if (!existingWorkspaceId) responseHeaders.set("Set-Cookie", workspaceCookie(workspaceId));
    return Response.json({
      ...result,
      restored: ["project brief", "latest saved plan", "setup checklist", "workflow versions"],
      notRestored: ["plan revision history", "verification reports", "manual and imported execution evidence", "debug reports"],
    }, { status: 201, headers: responseHeaders });
  } catch (error) {
    if (error instanceof ProjectLimitError) return Response.json({ error: error.message }, { status: 409, headers });
    return Response.json({ error: "Could not import this project backup. No project was created." }, { status: 500, headers });
  }
}
