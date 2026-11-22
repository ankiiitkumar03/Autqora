import type { ManualWorkflowTestEvidence, N8nExecutionEvidence, Project, ProjectPlan, ProjectPlanFreshness, ProjectSetup, WorkflowArtifact, WorkflowVerification } from "@/lib/project-domain";
import type { ProjectWebhookSecretStatus } from "@/lib/project-store";
import { getProjectScenario } from "@/lib/project-scenario";

function checkbox(value: boolean) {
  return value ? "[x]" : "[ ]";
}

export function buildDeploymentRunbook(
  project: Project,
  plan: ProjectPlan | null,
  setup: ProjectSetup,
  manualEvidence: ManualWorkflowTestEvidence[] = [],
  webhookSecretStatus?: ProjectWebhookSecretStatus,
  latestArtifact: WorkflowArtifact | null = null,
  verification: WorkflowVerification | null = null,
  executionEvidence: N8nExecutionEvidence | null = null,
  planFreshness: ProjectPlanFreshness = "unknown",
  openQuestions: string[] = [],
) {
  const scenario = getProjectScenario(project);
  const isWebhookIntake = scenario.isWebhookIntake;
  const isN8n = project.platform === "n8n" || isWebhookIntake || scenario.isInstagramPost || scenario.isGoogleSheetsLeadEmail || scenario.isYoutubeVideoClips;
  const requirements = project.requirements;
  const hasWebhookDestination = Boolean(requirements.destinationApp.trim()) && !/^(unknown|not sure|none|n\/a)$/i.test(requirements.destinationApp.trim());
  const lines = [
    `# AUTQORA Runbook — ${project.name}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "> Draft guidance only. AUTQORA has not deployed or executed this project. Confirm each provider’s current documentation and policies before production.",
    "",
    "## Project summary",
    `- Goal: ${project.goal.replace(/\s+/g, " ")}`,
    `- Preferred platform: ${project.platform ?? "Not selected"}`,
    `- Trigger: ${requirements.trigger || plan?.trigger || "Needs confirmation"}`,
    `- App path: ${requirements.sourceApp || "Unspecified"} → ${requirements.destinationApp || "Unspecified"}`,
    ...(requirements.destinationEndpoint ? [`- Configured destination request: ${requirements.destinationMethod} ${requirements.destinationEndpoint} (confirm the method, payload contract, and TLS availability before activation).`] : []),
    ...(isWebhookIntake && hasWebhookDestination ? [`- Destination authentication mode: ${requirements.destinationAuth === "none" ? "none (confirm the endpoint is intentionally public)" : requirements.destinationAuth === "httpBasicAuth" ? "HTTP Basic Auth (bind its credential in n8n)" : "HTTP Header Auth (bind its credential in n8n)"}.`] : []),
    ...(isWebhookIntake ? [`- Incoming webhook authentication: ${webhookSecretStatus?.configured ? `Secret generated in AUTQORA; expected n8n credential ${webhookSecretStatus.credentialName}, header ${webhookSecretStatus.headerName}. n8n binding is not independently verified; AUTQORA stores only a hash.` : "No secret generated; generate a one-time value in the project setup before exporting a webhook workflow."}`] : []),
    ...(requirements.fieldMappings.length ? ["- Field mappings:", ...requirements.fieldMappings.map((mapping) => `  - ${mapping.sourcePath} → ${mapping.targetPath}${mapping.required ? " (required)" : " (optional)"}`)] : []),
    `- Approximate volume: ${requirements.monthlyVolume || "Not provided"}`,
    `- Budget preference: ${requirements.budget}`,
    `- Technical comfort: ${requirements.technicalComfort}`,
    `- Constraints: ${requirements.constraints || "None provided"}`,
    ...(plan ? [`- Saved plan revision: ${plan.revision} (${planFreshness.replaceAll("_", " ")}).`] : ["- Plan: no saved revision; the displayed draft has not been saved yet."]),
    "",
    "## Open requirements",
    ...(openQuestions.length ? openQuestions.map((question) => `- [ ] ${question}`) : ["- No unanswered fields detected by AUTQORA's simple brief completeness checks."]),
    "",
    "## Current workflow and evidence",
    ...(latestArtifact ? [
      `- Saved workflow: v${latestArtifact.version} (${latestArtifact.scenario}), source status ${latestArtifact.sourceStatus.replaceAll("_", " ")}, created ${latestArtifact.createdAt}.`,
      ...(latestArtifact.sourceStatus === "stale" ? ["- Review or regenerate this workflow: its source requirements or plan changed after it was saved."] : []),
      ...(verification ? [
        `- Local JSON verification for v${verification.artifactVersion}: ${verification.status.replaceAll("_", " ")} (run ${verification.createdAt}).`,
        ...verification.checks.map((check) => `  - ${check.passed ? "PASS" : "REVIEW"}: ${check.label}`),
      ] : ["- Local JSON verification: no report saved for this workflow version yet."]),
      ...(executionEvidence ? [
        `- User-supplied n8n execution export for v${executionEvidence.artifactVersion}: reports status ${executionEvidence.reportedStatus}, imported ${executionEvidence.reportedAt}. AUTQORA did not authenticate the export.`,
        `  - Node names recorded: ${executionEvidence.nodeNames.join(", ") || "none"}.`,
        ...(executionEvidence.lastNodeExecuted ? [`  - Last node reported: ${executionEvidence.lastNodeExecuted}.`] : []),
        `  - Nodes reporting an error: ${executionEvidence.failedNodes.join(", ") || "none reported"}.`,
      ] : []),
    ] : ["- No workflow artifact has been saved for this project yet."]),
    "",
    "## Before deployment",
    `- ${checkbox(setup.workflow_imported)} Import the generated workflow into your own automation platform and inspect every node.`,
    `- ${checkbox(setup.fields_configured)} Replace placeholders and confirm inputs, destinations, and expected output.`,
    `- ${checkbox(setup.credentials_connected)} Add credentials only in the automation platform’s credential manager; never commit or paste tokens into project briefs.`,
    `- ${checkbox(setup.schedule_checked)} Confirm schedule, timezone, retry behavior, and expected run volume.`,
    `- ${checkbox(setup.test_reviewed)} Review side effects before running tests; a manual test may create a real post or record.`,
    "",
    "## Deployment sequence",
    "1. Use a test account or sandbox and synthetic data first.",
    "2. Validate required fields, duplicate handling, and failure paths.",
    "3. Confirm where execution logs are stored and who can view them.",
    "4. Set conservative retries and alerts; verify actions are safe to retry.",
    "5. Record a rollback procedure: disable the schedule/webhook, revoke credentials if exposed, and identify any records/posts requiring cleanup.",
    "6. Only enable production after a human owner reviews permissions, data handling, costs, and expected side effects.",
    "",
    "## Platform-specific notes",
    ...(isN8n ? [
      "- Keep the workflow unpublished while configuring it. Confirm instance timezone and execution history retention.",
      ...(isWebhookIntake ? [
        `- ${hasWebhookDestination ? requirements.fieldMappings.length ? `The generated webhook starter maps only the listed paths before forwarding JSON with HTTP ${requirements.destinationMethod} to ${requirements.destinationEndpoint ? `the configured ${requirements.destinationApp} endpoint` : `a configurable ${requirements.destinationApp} API endpoint`}; missing required source fields stop the run, while missing optional fields are skipped. It does not implement provider-specific upsert logic.` : `The generated webhook starter forwards the incoming JSON body with HTTP ${requirements.destinationMethod} to ${requirements.destinationEndpoint ? `the configured ${requirements.destinationApp} endpoint` : `a configurable ${requirements.destinationApp} API endpoint`}; it does not implement provider-specific mapping or upsert logic.` : "The generated webhook starter accepts HTTP POST and returns an acknowledgement; it does not yet process data in a destination app."}`,
        ...(webhookSecretStatus?.configured ? [`- In n8n, create a Header Auth credential named ${webhookSecretStatus.credentialName}, set Name to ${webhookSecretStatus.headerName}, paste the one-time secret as Value, and select it on the Webhook node. The workflow carries a safe reference template; n8n assigns the actual credential ID. Export the updated inactive workflow and upload it back to AUTQORA to validate that reference. Configure the sender to send that header. AUTQORA cannot recover the raw secret after its one-time display.`] : ["- Generate a one-time webhook secret in the project security panel before exporting. Do not share the production URL until Header Auth is bound in n8n and the sender has the header value."]),
        "- n8n's built-in Webhook Header Auth rejects missing/incorrect values before a workflow run. Keep the URL private; test and production URLs differ, and the production URL registers when the workflow is published.",
        "- When rotating, update the n8n Header Auth credential and sender. The previous value remains accepted by n8n until its credential is replaced.",
      ] : scenario.isYoutubeVideoClips ? [
        "- Start the local AUTQORA FFmpeg worker separately from n8n; keep its API key in a local environment file and bind it through an n8n Header Auth credential.",
        "- The n8n container calls host.docker.internal:8090. Verify that the container can reach the host worker before testing a video.",
        scenario.isClipPublishingPipeline
          ? "- This is a partial implementation for the requested live-stream-to-Instagram/YouTube pipeline. It clips authorized archived YouTube videos and includes opt-in YouTube-private and Instagram Reels publisher branches. Both require n8n credentials and have not been runtime-tested. It does not capture live streams, select meaningful moments, or pause for per-clip approval. Keep both publish switches off until a clip run is reviewed."
          : "- This implementation accepts public archived YouTube videos available without sign-in, and only content you own or are authorized to process. It can optionally upload clips privately to YouTube after OAuth is configured. It does not capture an active live stream.",
        "- The worker runs one video job at a time and cleans clip folders older than seven days before the next authenticated job by default. Set CLIP_RETENTION_SECONDS to 3600–2592000 in the worker .env to choose a 1-hour to 30-day retention period. Expired files may remain until another job starts; docker compose down -v removes all clips.",
        "- Keep port 8090 local; do not expose the worker publicly. Review the video source and clip links before sharing output.",
      ] : scenario.isInstagramPost ? [
        "- For the Instagram photo-post template, Meta requires an eligible professional account, publishing permission, and media publicly fetchable at publish time. Test publication can create a real post.",
        "- Schedule triggers run only after the n8n workflow is published; check the current n8n schedule and timezone documentation.",
      ] : scenario.isGoogleSheetsLeadEmail ? [
        "- The Google Sheets Trigger polls every minute by default. Confirm spreadsheet, worksheet tab, and column headings before activating the workflow.",
        "- A valid row sends lead details to the configured internal Gmail recipient; invalid or missing email addresses are skipped.",
        "- The starter does not deduplicate rows. Confirm trigger polling behavior and monitor n8n executions before relying on it for business notifications.",
        "- Configure Google Sheets and Gmail OAuth2 credentials in n8n only; AUTQORA stores no provider tokens.",
      ] : ["- Confirm the trigger's test/production behavior, timezone, and execution history retention before enabling the workflow."]),
    ] : [
      "- This project has no AUTQORA-generated platform-specific workflow for the selected platform yet.",
      "- Follow the platform’s current deployment, credential, schedule, and execution-log instructions.",
    ]),
    "",
    "## Plan checks",
    ...(plan?.verificationChecks.map((check) => `- [ ] ${check}`) ?? ["- [ ] Add project verification checks before deployment."]),
    "",
    "## Runtime and ownership",
    "- Runtime owner: ____________________",
    "- Credential owner and rotation date: ____________________",
    "- Monitoring destination: ____________________",
    "- Rollback owner: ____________________",
    "",
    "## User-reported manual test history",
    ...(manualEvidence.length > 0 ? manualEvidence.slice(0, 5).map((item) => `- **${item.result.toUpperCase()}**, workflow v${item.artifactVersion}, ${item.environment.replaceAll("_", " ")} on ${item.reportedAt}${item.executionReference ? ` (reference: ${item.executionReference})` : ""}: ${item.summary}`) : ["- No manual test result has been reported yet."]),
    "",
    "> Manual results are user-reported and were not independently confirmed by AUTQORA.",
    "",
    "AUTQORA runbook generator: informational only; no deployment was performed.",
    "",
  ];
  return lines.join("\n");
}
