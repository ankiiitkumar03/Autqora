import { z } from "zod";
import { debugPlatforms, diagnoseWorkflowError, redactSecrets } from "@/lib/debug-diagnostics";
import { reviewN8nWorkflow } from "@/lib/project-workflow";
import { diagnoseWithAi } from "@/lib/ai-debugging";
import { isSameOriginMutation } from "@/lib/request-security";
import { consumeAuthRateLimit, getLatestWorkflowArtifact, getProject, getWorkspaceId, listN8nExecutionEvidence, listProjectDebugReports, listWorkflowVerifications, saveProjectDebugReport } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  platform: z.enum(debugPlatforms),
  mode: z.enum(["rules", "ai"]).optional().default("rules"),
  error: z.string().trim().min(5).max(8_000),
  expected: z.string().trim().max(1_000).optional().default(""),
  workflowJson: z.string().max(24_000).optional().default(""),
  screenshot: z.object({
    mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    dataUrl: z.string().max(2_800_000),
  }).strict().optional(),
}).strict();
const headers = { "Cache-Control": "no-store, max-age=0" };
const maxRequestBytes = 3_000_000;
const maxScreenshotBytes = 2 * 1024 * 1024;

async function readBoundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let body = "";
  let bytesRead = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxRequestBytes) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  return body + decoder.decode();
}

type ScreenshotMediaType = "image/png" | "image/jpeg" | "image/webp";

function decodeScreenshot(dataUrl: string, expectedMediaType: ScreenshotMediaType): { mediaType: ScreenshotMediaType; base64: string } | null {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[1] !== expectedMediaType) return null;
  const [, matchedMediaType, encoded] = match;
  const mediaType = matchedMediaType as ScreenshotMediaType;
  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length === 0 || buffer.length > maxScreenshotBytes || buffer.toString("base64").replace(/=+$/, "") !== encoded.replace(/=+$/, "")) return null;
  const actualMediaType = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ? "image/png"
    : buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      ? "image/jpeg"
      : buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp"
        : null;
  if (actualMediaType !== mediaType) return null;
  return { mediaType, base64: encoded };
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  return Response.json({ reports: listProjectDebugReports(workspaceId, projectId) }, { headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxRequestBytes) return Response.json({ error: "Keep the request under 3 MB. Screenshots may be up to 2 MB." }, { status: 413, headers });
  let body: unknown;
  try {
    const raw = await readBoundedBody(request);
    if (raw === null || Buffer.byteLength(raw, "utf8") > maxRequestBytes) return Response.json({ error: "Keep the request under 3 MB. Screenshots may be up to 2 MB." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Send valid JSON with a sanitized error message." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Choose a platform, provide an error message between 5 and 8,000 characters, keep workflow JSON under 24 KB, and attach only a PNG, JPEG, or WebP screenshot under 2 MB." }, { status: 400, headers });
  if (parsed.data.workflowJson.trim() && parsed.data.platform !== "n8n") return Response.json({ error: "Workflow JSON review is currently available for n8n projects." }, { status: 400, headers });
  const decodedScreenshot = parsed.data.screenshot ? decodeScreenshot(parsed.data.screenshot.dataUrl, parsed.data.screenshot.mediaType) : undefined;
  if (parsed.data.screenshot && decodedScreenshot === null) return Response.json({ error: "The screenshot could not be validated. Use a PNG, JPEG, or WebP image under 2 MB." }, { status: 400, headers });
  const screenshot = decodedScreenshot ?? undefined;

  const error = redactSecrets(parsed.data.error);
  const expected = redactSecrets(parsed.data.expected);
  const priorUserReportedFeedback = listProjectDebugReports(workspaceId, projectId)
    .flatMap((report) => report.stepFeedback
      .filter((feedback) => feedback.status !== "not_started")
      .map((feedback) => ({
        category: report.diagnosis.category,
        stepIndex: feedback.stepIndex,
        step: report.diagnosis.steps[feedback.stepIndex] ?? "",
        status: feedback.status,
        note: feedback.note,
        updatedAt: feedback.updatedAt,
      })))
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, 12);
  let diagnosis = diagnoseWorkflowError(parsed.data.platform, error, expected);
  let workflowJson: unknown;
  if (parsed.data.workflowJson.trim()) {
    try {
      workflowJson = JSON.parse(parsed.data.workflowJson);
    } catch {
      return Response.json({ error: "Workflow JSON is invalid. Paste the exported workflow JSON or leave that field empty." }, { status: 400, headers });
    }
    diagnosis.workflowReview = reviewN8nWorkflow(workflowJson);
  }
  if (parsed.data.platform === "n8n") {
    const latest = getLatestWorkflowArtifact(workspaceId, projectId);
    if (latest) {
      const verification = listWorkflowVerifications(workspaceId, projectId).find((item) => item.artifactId === latest.artifact.id);
      const failedLocalChecks = verification?.checks.filter((check) => !check.passed).map((check) => check.label) ?? [];
      const execution = listN8nExecutionEvidence(workspaceId, projectId).find((item) => item.artifactId === latest.artifact.id);
      diagnosis.projectContext = {
        workflowVersion: latest.artifact.version,
        scenario: latest.artifact.scenario,
        localVerificationStatus: verification?.status ?? null,
        failedLocalChecks,
        importedExecution: execution ? {
          reportedStatus: execution.reportedStatus,
          nodeNames: execution.nodeNames,
          lastNodeExecuted: execution.lastNodeExecuted,
          failedNodes: execution.failedNodes,
        } : null,
      };
    }
  }
  if (parsed.data.mode === "ai") {
    if (!process.env.OPENAI_API_KEY?.trim()) return Response.json({ error: "AI debugging is not configured yet. Add OPENAI_API_KEY to the server environment when you are ready." }, { status: 503, headers });
    const limit = consumeAuthRateLimit(`ai-debug:${workspaceId}:${projectId}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) return Response.json({ error: "AI debugging is temporarily rate limited. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
    const context = diagnosis.projectContext;
    const review = diagnosis.workflowReview;
    try {
      diagnosis = await diagnoseWithAi({
        platform: parsed.data.platform,
        error,
        expected,
        workflowReview: review,
        projectContext: context,
        priorUserReportedFeedback,
        screenshot,
        savedRuleDiagnosis: { category: diagnosis.category, summary: diagnosis.summary, explanation: diagnosis.explanation, steps: diagnosis.steps, evidence: diagnosis.evidence },
      });
      if (screenshot) diagnosis.screenshotAnalyzed = true;
      if (review) diagnosis.workflowReview = review;
      if (context) diagnosis.projectContext = context;
    } catch (aiError) {
      return Response.json({ error: aiError instanceof Error ? aiError.message : "Could not analyze this run with AI." }, { status: 502, headers });
    }
  }
  try {
    const report = saveProjectDebugReport(workspaceId, projectId, parsed.data.platform, error, expected, diagnosis);
    return Response.json({ report }, { status: 201, headers });
  } catch {
    return Response.json({ error: "Could not save this diagnosis." }, { status: 500, headers });
  }
}
