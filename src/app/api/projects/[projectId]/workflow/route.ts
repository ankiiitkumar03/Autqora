import { randomUUID } from "node:crypto";
import { draftProjectPlan } from "@/lib/project-planning";
import { getProject, getProjectPlan, getProjectWebhookSecretStatus, getProjectWorkflowSourceFingerprint, getWorkspaceId, saveWorkflowArtifact } from "@/lib/project-store";
import { isSameOriginMutation } from "@/lib/request-security";
import { findInlineWorkflowSecrets, validateN8nWorkflow, verifyN8nWorkflow } from "@/lib/project-workflow";
import { getProjectScenario } from "@/lib/project-scenario";
import { hasUnsafeAiWorkflowContent } from "@/lib/ai-workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };

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
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  if (!workspaceId || !getProject(workspaceId, projectId)) return Response.json({ error: "Project not found." }, { status: 404, headers });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_048_576) return Response.json({ error: "Keep imported workflow JSON under 1 MB." }, { status: 413, headers });
  let workflow: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 1_048_576) return Response.json({ error: "Keep imported workflow JSON under 1 MB." }, { status: 413, headers });
    workflow = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Upload valid n8n workflow JSON." }, { status: 400, headers });
  }
  if (exceedsJsonDepth(workflow)) return Response.json({ error: "Workflow JSON is nested too deeply to import." }, { status: 400, headers });
  if (workflow && typeof workflow === "object" && !Array.isArray(workflow) && (workflow as { action?: unknown }).action === "save_generated") {
    const requestBody = workflow as { scenario?: unknown; workflow?: unknown; sourceFingerprint?: unknown };
    const scenarios = ["instagram_photo_post", "webhook_api_forward", "webhook_intake", "google_sheets_lead_email", "youtube_video_clips", "youtube_clip_publishing_pipeline", "generic_scaffold", "ai_generated_n8n"];
    if (typeof requestBody.scenario !== "string" || !scenarios.includes(requestBody.scenario)) {
      return Response.json({ error: "Choose a supported generated workflow scenario." }, { status: 400, headers });
    }
    const currentFingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
    if (typeof requestBody.sourceFingerprint !== "string" || requestBody.sourceFingerprint !== currentFingerprint) {
      return Response.json({ error: "Project requirements or plan changed while this workflow was being generated. Generate it again before saving." }, { status: 409, headers });
    }
    const workflowRecord = requestBody.workflow && typeof requestBody.workflow === "object" && !Array.isArray(requestBody.workflow)
      ? requestBody.workflow as { nodes?: unknown }
      : null;
    if (!workflowRecord || !Array.isArray(workflowRecord.nodes) || workflowRecord.nodes.length > 250) {
      return Response.json({ error: "Generated workflows must contain no more than 250 nodes." }, { status: 413, headers });
    }
    const validationErrors = validateN8nWorkflow(requestBody.workflow);
    if (validationErrors.length) return Response.json({ error: "Generated workflow did not pass validation.", details: validationErrors.slice(0, 8) }, { status: 400, headers });
    if (requestBody.scenario === "ai_generated_n8n" && hasUnsafeAiWorkflowContent(requestBody.workflow)) return Response.json({ error: "AI-generated workflows cannot contain code, shell, file-system, or remote-shell nodes and are limited to 25 nodes." }, { status: 400, headers });
    const scenarioCheck = verifyN8nWorkflow(requestBody.workflow, requestBody.scenario).checks.find((check) => check.id === "scenario_nodes");
    if (!scenarioCheck?.passed) return Response.json({ error: "The workflow does not match the selected generated scenario." }, { status: 400, headers });
    if (findInlineWorkflowSecrets(requestBody.workflow).length) return Response.json({ error: "Remove inline credentials before saving the workflow. Keep secrets in n8n credentials." }, { status: 400, headers });
    try {
      const name = (requestBody.workflow as { name: string }).name;
      const artifact = saveWorkflowArtifact(workspaceId, projectId, name, requestBody.scenario, requestBody.workflow, currentFingerprint);
      return Response.json({ artifact }, { status: 201, headers });
    } catch {
      return Response.json({ error: "Could not save the generated workflow version." }, { status: 500, headers });
    }
  }
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) return Response.json({ error: "Upload an n8n workflow JSON object." }, { status: 400, headers });
  const record = workflow as { name?: unknown; nodes?: unknown };
  if (!Array.isArray(record.nodes)) return Response.json({ error: "This JSON does not contain an n8n node list." }, { status: 400, headers });
  if (record.nodes.length > 250) return Response.json({ error: "Imported workflows are limited to 250 nodes." }, { status: 413, headers });
  const structuralIssues = validateN8nWorkflow(workflow, { requireInactive: false, allowCustomNodeTypes: true });
  if (structuralIssues.length) return Response.json({ error: "This JSON does not match the supported n8n workflow structure.", details: structuralIssues.slice(0, 8) }, { status: 400, headers });
  const inlineSecrets = findInlineWorkflowSecrets(workflow);
  if (inlineSecrets.length) return Response.json({ error: "Remove inline credentials before importing this workflow. Keep secrets in n8n credentials.", details: inlineSecrets }, { status: 400, headers });
  const serialized = JSON.stringify(workflow);
  if (serialized.length > 1_048_576 || redactSerializedSecrets(serialized)) return Response.json({ error: "Remove token-like values from the workflow before importing it." }, { status: 400, headers });
  const safeWorkflow = { ...(workflow as Record<string, unknown>), active: false };
  try {
    const name = (record.name as string).trim().slice(0, 200);
    const artifact = saveWorkflowArtifact(workspaceId, projectId, name, "imported_n8n", safeWorkflow);
    return Response.json({ artifact, message: "Workflow imported as an inactive project version." }, { status: 201, headers });
  } catch {
    return Response.json({ error: "Could not save the imported workflow version." }, { status: 500, headers });
  }
}

function redactSerializedSecrets(serialized: string) {
  return /\b(?:Bearer\s+[A-Za-z0-9._~+/=-]{12,}|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})\b/i.test(serialized);
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const workspaceId = getWorkspaceId(request);
  const { projectId } = await params;
  const project = workspaceId ? getProject(workspaceId, projectId) : null;
  if (!workspaceId || !project) return Response.json({ error: "Project not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });

  const plan = getProjectPlan(workspaceId, projectId) ?? draftProjectPlan(project);
  const sourceFingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
  const { isInstagramPost, isWebhookIntake, isGoogleSheetsLeadEmail, isYoutubeVideoClips, isClipPublishingPipeline } = getProjectScenario(project);
  const webhookAuth = isWebhookIntake ? getProjectWebhookSecretStatus(workspaceId, projectId) : null;
  if (isWebhookIntake && !webhookAuth?.configured) {
    return Response.json({ error: "Generate a one-time webhook secret in this project before exporting the protected workflow." }, { status: 409, headers });
  }
  const { isWebhookForward } = getProjectScenario(project);
  const hasWebhookDestination = isWebhookForward;
  const hasFieldMappings = isWebhookForward && project.requirements.fieldMappings.length > 0;
  const workflow = isYoutubeVideoClips
    ? (() => {
        const manualName = "Start clip generation";
        const configName = "Set clip options";
        const workerName = "Create vertical clips with FFmpeg";
        const outputName = "Return clip download links";
        const instagramOptions = isClipPublishingPipeline
          ? `, publishToInstagram: false, instagramUserId: "REPLACE_WITH_INSTAGRAM_PROFESSIONAL_ACCOUNT_ID", instagramCaption: "REPLACE_WITH_REEL_CAPTION"`
          : "";
        return {
          name: `AUTQORA YouTube video to shorts - ${project.name}`,
          nodes: [
            { parameters: {}, id: randomUUID(), name: manualName, type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: [220, 300] },
            {
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `// Use a public archived video you own or are authorized to process. Live capture is not supported.\n// Uploads create real posts. Keep all opt-ins false until you have reviewed a prior clip run.\nreturn [{ json: { sourceUrl: "REPLACE_WITH_PUBLIC_YOUTUBE_VIDEO_URL", clipCount: 5, clipDurationSeconds: 18, publishToYouTube: false, youtubeTitlePrefix: "Short"${instagramOptions} } }];`,
              },
              id: randomUUID(), name: configName, type: "n8n-nodes-base.code", typeVersion: 2, position: [460, 300],
            },
            {
              parameters: {
                method: "POST",
                url: "http://host.docker.internal:8090/clips",
                authentication: "genericCredentialType",
                genericAuthType: "httpHeaderAuth",
                sendBody: true,
                contentType: "json",
                specifyBody: "json",
                jsonBody: "={{ { sourceUrl: $json.sourceUrl, clipCount: $json.clipCount, clipDurationSeconds: $json.clipDurationSeconds } }}",
                options: { timeout: 600000 },
              },
              id: randomUUID(), name: workerName, type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [740, 300],
              credentials: { httpHeaderAuth: { id: "REPLACE_WITH_CLIP_WORKER_CREDENTIAL_ID", name: "AUTQORA Clip Worker" } },
            },
            {
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `const response = $input.first().json;\nif (!Array.isArray(response.clips) || response.clips.length === 0) throw new Error("Clip worker returned no clips.");\nconst options = $("Set clip options").first().json;\nreturn response.clips.map((clip) => ({ json: { fileName: clip.fileName, durationSeconds: clip.durationSeconds, downloadUrl: clip.downloadUrl, youtubeTitle: (options.youtubeTitlePrefix + " " + clip.fileName).slice(0, 100), publishToYouTube: options.publishToYouTube === true, publishToInstagram: options.publishToInstagram === true } }));`,
              },
              id: randomUUID(), name: outputName, type: "n8n-nodes-base.code", typeVersion: 2, position: [1020, 300],
            },
            {
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `return $input.all().filter((item) => item.json.publishToYouTube === true || item.json.publishToInstagram === true);`,
              },
              id: randomUUID(), name: "Only download clips when a platform is opted in", type: "n8n-nodes-base.code", typeVersion: 2, position: [1220, 300],
            },
            {
              parameters: {
                method: "GET",
                url: "={{ $json.downloadUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal') }}",
                options: { response: { response: { responseFormat: "file", outputPropertyName: "data" } } },
              },
              id: randomUUID(), name: "Download clip for publishing", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [1460, 300],
            },
            {
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `return $input.all().filter((item) => item.json.publishToYouTube === true);`,
              },
              id: randomUUID(), name: "Only upload to YouTube when opted in", type: "n8n-nodes-base.code", typeVersion: 2, position: [1700, 160],
            },
            ...(isClipPublishingPipeline ? [{
              parameters: { mode: "runOnceForAllItems", jsCode: `return $input.all().filter((item) => item.json.publishToInstagram === true);` },
              id: randomUUID(), name: "Only upload to Instagram when opted in", type: "n8n-nodes-base.code", typeVersion: 2, position: [1700, 500],
            }] : []),
            {
              parameters: {
                resource: "video",
                operation: "upload",
                title: "={{ $json.youtubeTitle }}",
                binaryProperty: "data",
                options: { description: "={{ 'Short clip generated from an authorized source video by AUTQORA. ' + $json.fileName }}", notifySubscribers: false, privacyStatus: "private" },
              },
              id: randomUUID(), name: "Upload YouTube Short as private", type: "n8n-nodes-base.youTube", typeVersion: 1, position: [2180, 160],
              credentials: { youTubeOAuth2Api: { id: "REPLACE_WITH_YOUTUBE_CREDENTIAL_ID", name: "YouTube OAuth2" } },
            },
            ...(isClipPublishingPipeline ? [{
              parameters: {
                method: "POST",
                url: "=https://graph.facebook.com/v27.0/{{$('Set clip options').first().json.instagramUserId}}/media",
                authentication: "genericCredentialType",
                genericAuthType: "httpHeaderAuth",
                sendQuery: true,
                queryParameters: { parameters: [
                  { name: "media_type", value: "REELS" },
                  { name: "upload_type", value: "resumable" },
                  { name: "caption", value: "={{ $('Set clip options').first().json.instagramCaption }}" },
                ] },
                options: {},
              },
              id: randomUUID(), name: "Create Instagram Reel upload session", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [1940, 500],
              credentials: { httpHeaderAuth: { id: "REPLACE_WITH_META_BEARER_CREDENTIAL_ID", name: "AUTQORA Meta Graph Bearer" } },
            },
            {
              parameters: { mode: "combine", combineBy: "combineByPosition", options: {} },
              id: randomUUID(), name: "Pair Reel session with clip file", type: "n8n-nodes-base.merge", typeVersion: 3.2, position: [2180, 500],
            },
            {
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `const items = $input.all();\nfor (let index = 0; index < items.length; index++) {\n  const buffer = await this.helpers.getBinaryDataBuffer(index, "data");\n  items[index].json.fileSizeBytes = buffer.length;\n}\nreturn items;`,
              },
              id: randomUUID(), name: "Measure Reel upload bytes", type: "n8n-nodes-base.code", typeVersion: 2, position: [2420, 500],
            },
            {
              parameters: {
                method: "POST",
                url: "=https://rupload.facebook.com/ig-api-upload/v27.0/{{$json.id}}",
                authentication: "genericCredentialType",
                genericAuthType: "httpHeaderAuth",
                sendHeaders: true,
                headerParameters: { parameters: [
                  { name: "offset", value: "0" },
                  { name: "file_size", value: "={{ $json.fileSizeBytes }}" },
                ] },
                sendBody: true,
                contentType: "binaryData",
                inputDataFieldName: "data",
                options: {},
              },
              id: randomUUID(), name: "Upload Reel video bytes to Meta", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [2660, 500],
              credentials: { httpHeaderAuth: { id: "REPLACE_WITH_META_OAUTH_UPLOAD_CREDENTIAL_ID", name: "AUTQORA Meta Resumable Upload" } },
            },
            {
              parameters: {
                method: "POST",
                url: "=https://graph.facebook.com/v27.0/{{$('Set clip options').first().json.instagramUserId}}/media_publish",
                authentication: "genericCredentialType",
                genericAuthType: "httpHeaderAuth",
                sendQuery: true,
                queryParameters: { parameters: [{ name: "creation_id", value: "={{ $('Pair Reel session with clip file').item.json.id }}" }] },
                options: {},
              },
              id: randomUUID(), name: "Publish Instagram Reel", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [2900, 500],
              credentials: { httpHeaderAuth: { id: "REPLACE_WITH_META_BEARER_CREDENTIAL_ID", name: "AUTQORA Meta Graph Bearer" } },
            }] : []),
          ],
          connections: {
            [manualName]: { main: [[{ node: configName, type: "main", index: 0 }]] },
            [configName]: { main: [[{ node: workerName, type: "main", index: 0 }]] },
            [workerName]: { main: [[{ node: outputName, type: "main", index: 0 }]] },
            [outputName]: { main: [[{ node: "Only download clips when a platform is opted in", type: "main", index: 0 }]] },
            "Only download clips when a platform is opted in": { main: [[{ node: "Download clip for publishing", type: "main", index: 0 }]] },
            "Download clip for publishing": { main: [[
              { node: "Only upload to YouTube when opted in", type: "main", index: 0 },
              ...(isClipPublishingPipeline ? [{ node: "Only upload to Instagram when opted in", type: "main", index: 0 }] : []),
            ]] },
            "Only upload to YouTube when opted in": { main: [[{ node: "Upload YouTube Short as private", type: "main", index: 0 }]] },
            ...(isClipPublishingPipeline ? {
            "Only upload to Instagram when opted in": { main: [[
              { node: "Create Instagram Reel upload session", type: "main", index: 0 },
              { node: "Pair Reel session with clip file", type: "main", index: 0 },
            ]] },
            "Create Instagram Reel upload session": { main: [[{ node: "Pair Reel session with clip file", type: "main", index: 1 }]] },
            "Pair Reel session with clip file": { main: [[{ node: "Measure Reel upload bytes", type: "main", index: 0 }]] },
            "Measure Reel upload bytes": { main: [[{ node: "Upload Reel video bytes to Meta", type: "main", index: 0 }]] },
            "Upload Reel video bytes to Meta": { main: [[{ node: "Publish Instagram Reel", type: "main", index: 0 }]] },
            } : {}),
          },
          active: false,
          settings: { executionOrder: "v1", timezone: "Asia/Kolkata" },
          versionId: randomUUID(),
          meta: { templateCredsSetupCompleted: false },
          tags: [],
        };
      })()
    : isInstagramPost
    ? {
        name: `AUTQORA Instagram photo post - ${project.name}`,
        nodes: [
          { parameters: {}, id: randomUUID(), name: "Test Instagram post manually", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: [240, 360] },
          { parameters: { rule: { interval: [{ field: "days", triggerAtHour: 9, triggerAtMinute: 0 }] } }, id: randomUUID(), name: "Daily Instagram post schedule", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [240, 160] },
          {
            parameters: {
              mode: "runOnceForAllItems",
              jsCode: `// Replace these three example values before running. Keep access tokens in n8n credentials.\nreturn [{ json: { igUserId: "REPLACE_WITH_INSTAGRAM_PROFESSIONAL_ACCOUNT_ID", imageUrl: "https://REPLACE_WITH_PUBLIC_JPEG_URL", caption: "REPLACE_WITH_POST_CAPTION" } }];`,
            },
            id: randomUUID(), name: "Instagram post details", type: "n8n-nodes-base.code", typeVersion: 2, position: [520, 260],
          },
          {
            parameters: {
              method: "POST",
              url: "=https://graph.instagram.com/v27.0/{{$json.igUserId}}/media",
              authentication: "genericCredentialType",
              genericAuthType: "httpHeaderAuth",
              sendQuery: true,
              queryParameters: { parameters: [
                { name: "image_url", value: "={{ $json.imageUrl }}" },
                { name: "caption", value: "={{ $json.caption }}" },
              ] },
              options: {},
            },
            id: randomUUID(), name: "Create Instagram photo container", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [800, 260],
          },
          {
            parameters: {
              method: "POST",
              url: "=https://graph.instagram.com/v27.0/{{$('Instagram post details').first().json.igUserId}}/media_publish",
              authentication: "genericCredentialType",
              genericAuthType: "httpHeaderAuth",
              sendQuery: true,
              queryParameters: { parameters: [{ name: "creation_id", value: "={{ $json.id }}" }] },
              options: {},
            },
            id: randomUUID(), name: "Publish Instagram photo", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [1080, 260],
          },
        ],
        connections: {
          "Test Instagram post manually": { main: [[{ node: "Instagram post details", type: "main", index: 0 }]] },
          "Daily Instagram post schedule": { main: [[{ node: "Instagram post details", type: "main", index: 0 }]] },
          "Instagram post details": { main: [[{ node: "Create Instagram photo container", type: "main", index: 0 }]] },
          "Create Instagram photo container": { main: [[{ node: "Publish Instagram photo", type: "main", index: 0 }]] },
        },
        active: false,
        settings: { executionOrder: "v1", timezone: "Asia/Kolkata" },
        versionId: randomUUID(),
        meta: { templateCredsSetupCompleted: false },
        tags: [],
      }
    : isGoogleSheetsLeadEmail
      ? (() => {
          const triggerName = "New lead in Google Sheet";
          const validateName = "Validate lead email and format notification";
          const ifName = "Email valid?";
          const sendName = "Send lead notification email";
          const skipName = "Skip invalid or missing email";
          return {
            name: `AUTQORA lead notification - ${project.name}`,
            nodes: [
              {
                parameters: {
                  pollTimes: { item: [{ mode: "everyMinute" }] },
                  authentication: "triggerOAuth2",
                  documentId: { __rl: true, value: "REPLACE_WITH_GOOGLE_SHEET_ID", mode: "id" },
                  sheetName: { __rl: true, value: "Leads", mode: "name" },
                  event: "rowAdded",
                  options: {},
                },
                id: randomUUID(), name: triggerName, type: "n8n-nodes-base.googleSheetsTrigger", typeVersion: 1, position: [240, 300],
                credentials: { googleSheetsTriggerOAuth2Api: { id: "REPLACE_WITH_GOOGLE_SHEETS_CREDENTIAL_ID", name: "Google Sheets OAuth2" } },
              },
              {
                parameters: {
                  mode: "runOnceForAllItems",
                  jsCode: `const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nreturn $input.all().map((item) => {\n  const row = item.json;\n  const email = String(row.email ?? row.Email ?? "").trim();\n  const name = String(row.name ?? row.Name ?? "New lead").trim();\n  const company = String(row.company ?? row.Company ?? "").trim();\n  const source = String(row.source ?? row.Source ?? "").trim();\n  const details = [name, email, company && "Company: " + company, source && "Source: " + source].filter(Boolean).join("\\n");\n  return { json: { ...row, isValid: emailPattern.test(email), notificationSubject: "New lead: " + name, notificationBody: "A new lead was added to Google Sheets.\\n\\n" + details } };\n});`,
                },
                id: randomUUID(), name: validateName, type: "n8n-nodes-base.code", typeVersion: 2, position: [500, 300],
              },
              {
                parameters: {
                  conditions: {
                    options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 },
                    conditions: [{ id: randomUUID(), leftValue: "={{ $json.isValid }}", rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }],
                    combinator: "and",
                  },
                },
                id: randomUUID(), name: ifName, type: "n8n-nodes-base.if", typeVersion: 2.2, position: [780, 300],
              },
              {
                parameters: { resource: "message", operation: "send", sendTo: "REPLACE_WITH_NOTIFICATION_EMAIL", subject: "={{ $json.notificationSubject }}", emailType: "text", message: "={{ $json.notificationBody }}", options: {} },
                id: randomUUID(), name: sendName, type: "n8n-nodes-base.gmail", typeVersion: 2.1, position: [1060, 200],
                credentials: { gmailOAuth2: { id: "REPLACE_WITH_GMAIL_CREDENTIAL_ID", name: "Gmail OAuth2" } },
              },
              { parameters: {}, id: randomUUID(), name: skipName, type: "n8n-nodes-base.noOp", typeVersion: 1, position: [1060, 400] },
            ],
            connections: {
              [triggerName]: { main: [[{ node: validateName, type: "main", index: 0 }]] },
              [validateName]: { main: [[{ node: ifName, type: "main", index: 0 }]] },
              [ifName]: { main: [[{ node: sendName, type: "main", index: 0 }], [{ node: skipName, type: "main", index: 0 }]] },
            },
            active: false,
            settings: { executionOrder: "v1", timezone: "Asia/Kolkata" },
            versionId: randomUUID(),
            meta: { templateCredsSetupCompleted: false },
            tags: [],
          };
        })()
      : isWebhookIntake
      ? (() => {
          const nodes = [
            {
              parameters: { httpMethod: "POST", path: `autqora-intake-${projectId.slice(0, 8)}`, responseMode: "responseNode", authentication: "headerAuth", options: {} },
              id: randomUUID(), name: "Receive webhook request", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [260, 300],
              credentials: { httpHeaderAuth: { id: "AUTQORA_CREDENTIAL_ID_REQUIRED", name: webhookAuth!.credentialName } },
            },
    ...(hasFieldMappings ? [{
              parameters: {
                mode: "runOnceForAllItems",
                jsCode: `const mappings = ${JSON.stringify(project.requirements.fieldMappings)};\nreturn $input.all().map((item) => {\n  const input = item.json;\n  const output = {};\n  for (const mapping of mappings) {\n    const value = mapping.sourcePath.split(".").reduce((current, key) => current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined, input);\n    if (value === undefined) {\n      if (mapping.required) throw new Error("Required source field is missing: " + mapping.sourcePath);\n      continue;\n    }\n    const path = mapping.targetPath.split(".");\n    let target = output;\n    for (const segment of path.slice(0, -1)) {\n      if (!target[segment] || typeof target[segment] !== "object" || Array.isArray(target[segment])) target[segment] = {};\n      target = target[segment];\n    }\n    target[path[path.length - 1]] = value;\n  }\n  return { json: output };\n});`,
              },
              id: randomUUID(), name: "Map destination fields", type: "n8n-nodes-base.code", typeVersion: 2, position: [520, 300],
            }] : []),
            ...(isWebhookForward ? [{
              parameters: {
                method: project.requirements.destinationMethod,
                url: project.requirements.destinationEndpoint || "https://REPLACE_WITH_DESTINATION_HOST/PATH",
                authentication: project.requirements.destinationAuth === "none" ? "none" : "genericCredentialType",
                ...(project.requirements.destinationAuth === "none" ? {} : { genericAuthType: project.requirements.destinationAuth }),
                sendBody: true,
                contentType: "json",
                specifyBody: "json",
                jsonBody: hasFieldMappings ? "={{ $json }}" : "={{ $json.body ?? $json }}",
                options: { timeout: 10000 },
              },
              id: randomUUID(), name: `Send data to ${project.requirements.destinationApp}`, type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [hasFieldMappings ? 800 : 560, 300],
            }] : []),
            {
              parameters: {
                respondWith: "json",
                responseBody: isWebhookForward
                  ? "={{ { received: true, forwarded: true } }}"
                  : "={{ { received: true, payload: $json.body ?? $json } }}",
                options: { responseCode: 200 },
              },
              id: randomUUID(), name: "Return accepted response", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1.1, position: [isWebhookForward ? hasFieldMappings ? 1080 : 860 : 560, 300],
            },
          ];
          return {
            name: `AUTQORA webhook ${isWebhookForward ? "to API" : "intake"} - ${project.name}`,
            nodes,
            connections: {
              "Receive webhook request": { main: [[{ node: hasFieldMappings ? "Map destination fields" : isWebhookForward ? `Send data to ${project.requirements.destinationApp}` : "Return accepted response", type: "main", index: 0 }]] },
              ...(hasFieldMappings ? { "Map destination fields": { main: [[{ node: `Send data to ${project.requirements.destinationApp}`, type: "main", index: 0 }]] } } : {}),
              ...(isWebhookForward ? { [`Send data to ${project.requirements.destinationApp}`]: { main: [[{ node: "Return accepted response", type: "main", index: 0 }]] } } : {}),
            },
            active: false,
            settings: { executionOrder: "v1" },
            versionId: randomUUID(),
            meta: {
              templateCredsSetupCompleted: false,
              autqoraWebhookAuth: {
                credentialType: "httpHeaderAuth",
                credentialName: webhookAuth!.credentialName,
                headerName: webhookAuth!.headerName,
                referenceStatus: "Create this Header Auth credential in n8n and select it on the Webhook node; n8n must supply its instance-specific credential ID.",
              },
            },
            tags: [],
          };
        })()
      : (() => {
  const payload = JSON.stringify({
    draft: true,
    project: { name: project.name, goal: project.goal, platform: project.platform },
    plan: { objective: plan.objective, trigger: plan.trigger, implementationSteps: plan.implementationSteps, assumptions: plan.assumptions, verificationChecks: plan.verificationChecks },
    notice: "AUTQORA starter scaffold only. Replace the placeholder steps and configure credentials safely before enabling this workflow.",
  }, null, 2);

  const workflow = {
    name: `AUTQORA draft - ${project.name}`,
    nodes: [
      { parameters: {}, id: randomUUID(), name: "When clicking ‘Execute workflow’", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: [240, 300] },
      {
        parameters: {
          mode: "runOnceForAllItems",
          jsCode: `// Starter scaffold generated by AUTQORA. It does not perform the requested automation yet.\nreturn [{ json: ${payload} }];`,
        },
        id: randomUUID(), name: "AUTQORA implementation draft", type: "n8n-nodes-base.code", typeVersion: 2, position: [500, 300],
      },
    ],
    connections: {
      "When clicking ‘Execute workflow’": { main: [[{ node: "AUTQORA implementation draft", type: "main", index: 0 }]] },
    },
    active: false,
    settings: { executionOrder: "v1" },
    versionId: randomUUID(),
    meta: { templateCredsSetupCompleted: false },
    tags: [],
  };
  return workflow;
  })();

  const prefix = isYoutubeVideoClips ? "autqora-youtube-shorts" : isInstagramPost ? "autqora-instagram" : isGoogleSheetsLeadEmail ? "autqora-lead-email" : isWebhookIntake ? "autqora-webhook" : "autqora";
  const scenario = isClipPublishingPipeline ? "youtube_clip_publishing_pipeline" : isYoutubeVideoClips ? "youtube_video_clips" : isInstagramPost ? "instagram_photo_post" : isGoogleSheetsLeadEmail ? "google_sheets_lead_email" : isWebhookForward ? "webhook_api_forward" : isWebhookIntake ? "webhook_intake" : "generic_scaffold";
  const validationErrors = validateN8nWorkflow(workflow);
  if (validationErrors.length) return Response.json({ error: "Generated workflow did not pass validation.", details: validationErrors }, { status: 422, headers: { "Cache-Control": "no-store" } });
  const fileName = `${prefix}-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project"}-draft.json`;
  return new Response(JSON.stringify(workflow, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Autqora-Scenario": scenario,
      "X-Autqora-Source-Fingerprint": sourceFingerprint ?? "",
    },
  });
}
