import type { Project, ProjectPlanInput } from "@/lib/project-domain";
import { getProjectScenario } from "@/lib/project-scenario";

/** Returns concrete unanswered implementation questions from the saved brief. */
export function identifyOpenProjectQuestions(project: Project) {
  const { requirements } = project;
  const scenario = getProjectScenario(project);
  const questions: string[] = [];
  if (scenario.isClipPublishingPipeline) {
    questions.push("Is this your own YouTube live stream or a source you have permission to capture and republish?");
    questions.push("Should AUTQORA capture while the stream is live, process the saved replay afterward, or support both?");
    questions.push("How should it choose 15–20 second clips: fixed intervals, speech/highlight detection, or your manual selection?");
    questions.push("Should every candidate publish automatically, or should you review and approve each clip first?");
    questions.push("What title/caption rules, posting schedule, and initial privacy setting should each platform use?");
    questions.push("The current export only makes local clips. Which Instagram professional account and YouTube channel will you connect in n8n Credentials?");
    return questions;
  }
  if (scenario.isYoutubeVideoClips) {
    if (!requirements.trigger.trim()) questions.push("Which authorized archived YouTube video will you use for the first test? Enter its URL in n8n, not in the project brief.");
    questions.push("How many clips should each run create? The starter default is 5; it supports 1–10.");
    questions.push("Should clips stay at the 18-second default, or use another duration from 15–20 seconds?");
    return questions;
  }
  if (scenario.isGoogleSheetsLeadEmail) {
    questions.push("Which spreadsheet and worksheet tab should n8n watch? Set the spreadsheet ID in n8n.");
    questions.push("Which internal email address should receive the lead notifications? Set it in n8n, not in the project brief.");
    questions.push("Do your columns use email/name/company/source headings, or should the validation node be adjusted?");
    return questions;
  }
  if (!requirements.trigger.trim()) questions.push("What event, schedule, or request should start the workflow?");
  if (!requirements.sourceApp.trim()) questions.push("Which app or system provides the incoming data?");
  if (!requirements.destinationApp.trim()) questions.push("Which app, system, or endpoint should receive the result?");
  else if (scenario.isWebhookForward && !requirements.destinationEndpoint.trim()) questions.push("What exact HTTPS API endpoint should receive the webhook data? Keep credentials out of the URL.");
  if (!requirements.fieldMappings.length) questions.push("Which fields should move from the input into the destination?");
  if (!requirements.monthlyVolume.trim()) questions.push("About how many runs or records should it handle each month?");
  if (requirements.budget === "unknown") questions.push("What monthly budget should recommendations stay within?");
  if (requirements.technicalComfort === "unknown") questions.push("How comfortable are you with configuring APIs, credentials, and code?");
  return questions.slice(0, 6);
}

/** A transparent, rule-based starter plan. It does not call an AI model. */
export function draftProjectPlan(project: Project): ProjectPlanInput {
  const { isInstagramPost, isWebhookIntake, isGoogleSheetsLeadEmail, isYoutubeVideoClips, isClipPublishingPipeline } = getProjectScenario(project);
  const { requirements } = project;
  const source = requirements.sourceApp || "the source app";
  const destination = requirements.destinationApp || "the destination app";
  if (isClipPublishingPipeline) {
    return {
      objective: project.goal,
      trigger: requirements.trigger || "Start from an authorized YouTube live stream or its saved replay; require review before publishing clips during the MVP.",
      implementationSteps: [
        "Current AUTQORA coverage is partial: the export handles an authorized archived video, creates local 9:16 clips, and includes opt-in private YouTube and Instagram Reels upload branches. Live capture, highlight selection, and an in-workflow review step are still missing.",
        "Confirm source authorization and decide whether to process the live feed continuously, the saved replay afterward, or both. Keep the first test to a replay you own or are authorized to use.",
        "Choose how candidate segments are selected (fixed intervals, speech/highlight detection, or manual timestamps), plus duplicate handling and the 15–20 second duration rule.",
        "Import and test the current upload branches with n8n credentials: YouTube OAuth2, plus Meta Graph Header Auth and Meta resumable-upload Header Auth. Both platform switches default off; YouTube uploads are private.",
        "Add an in-workflow review gate and durable state for every candidate clip before turning on scheduled or automatic posting. Do not expose the local clip worker publicly.",
        "Record each source, clip, platform response, retry, and approval outcome so failed posts can be retried without duplicating successful posts.",
      ],
      assumptions: "The source is a live stream or replay that you own or are authorized to capture and republish. The current workflow processes archived public videos only. It includes optional YouTube private uploads and Instagram Reels publishing, but these branches have not been import-tested and require user-configured credentials. Instagram requires an eligible professional account and a Meta app with Facebook Login for Business content-publishing access. Keep both opt-ins false until reviewing generated clips; live capture, meaningful-moment selection, an in-workflow approval gate, duplicate-safe retries, and runtime verification are still unimplemented.",
      verificationChecks: [
        "The live/replay source is authorized and produces distinct, non-overlapping clips with durations between 15 and 20 seconds.",
        "Every candidate is reviewed and approved before its first platform upload; the test YouTube visibility is private or unlisted.",
        "A test Reel and a test YouTube upload each return their platform media IDs and links, with no duplicate post after a retry.",
        "Failure at either publisher is logged and retryable without reprocessing or reposting a platform upload that already succeeded.",
      ],
    };
  }
  if (isYoutubeVideoClips) {
    return {
      objective: project.goal,
      trigger: requirements.trigger || "Manual run in n8n after setting the URL of a public archived YouTube video.",
      implementationSteps: [
        "Start the local AUTQORA FFmpeg worker with Docker Compose and keep its API key in a local environment file.",
        "Import the inactive n8n workflow and bind a Header Auth credential to the clip-worker request node.",
        "Set the source video URL, clip count (1–10), and duration (15–20 seconds) in Set clip options.",
        "Run the workflow manually; the worker samples evenly spaced segments, center-crops them to portrait 9:16, and returns local MP4 download links.",
        "Review every clip's framing, audio, and usage rights before sharing or publishing it. The optional YouTube branch is off by default; enable it only after review and configure YouTube OAuth2. Upload visibility remains private.",
      ],
      assumptions: "This starter processes a public archived YouTube video that is available without sign-in and that you own or are authorized to process. The worker runs on the same Windows host as Docker Desktop and n8n reaches it at host.docker.internal:8090. It does not capture a live stream, select clips by scene or speech, or add captions. YouTube uploads are available as an opt-in private branch but have not been runtime-tested. Keep the worker port local and configure its API key and YouTube OAuth2 in n8n Credentials.",
      verificationChecks: [
        "A valid archived source produces the requested number of MP4 clips, each 15–20 seconds long.",
        "Every clip is portrait 9:16 and preserves audio when the source has audio.",
        "The workflow returns one local download URL for every generated clip.",
        "A missing worker credential, invalid URL, unsupported playlist, or unavailable source fails visibly without enabling the workflow.",
      ],
    };
  }

  if (isGoogleSheetsLeadEmail) {
    return {
      objective: project.goal,
      trigger: requirements.trigger || "A new row is added to the configured Google Sheets tab; n8n polls once per minute by default.",
      implementationSteps: [
        "Choose the Google spreadsheet and tab that contain the lead rows; use email/name headings or adjust the validation node to match your sheet.",
        "Select Google Sheets OAuth2 and Gmail OAuth2 credentials in n8n. Set the notification recipient on the Gmail node.",
        "The workflow validates each new row's email address and formats the lead details for an internal notification.",
        "Rows with missing or malformed email addresses follow the skip branch and do not send an email.",
        "Test one valid and one invalid synthetic row, review the Gmail recipient and message, then activate the workflow only when the results are correct.",
      ],
      assumptions: "The workflow processes new rows from one Google Sheets tab and sends notifications to a configured internal email address. It recognizes email/Email, name/Name, and optional company/Company and source/Source columns. It skips invalid emails but does not deduplicate rows or send messages to the leads themselves. The workflow stays inactive until you configure the spreadsheet, credentials, and recipient in n8n.",
      verificationChecks: [
        "A newly added row with a valid email reaches the Gmail node with the expected lead details.",
        "A row with a missing or malformed email reaches the skip branch and sends no email.",
        "The configured spreadsheet, worksheet tab, Gmail credential, and notification recipient are correct.",
        "A safe manual test succeeds before the workflow is activated; AUTQORA does not send test emails itself.",
      ],
    };
  }

  if (isInstagramPost) {
    return {
      objective: project.goal,
      trigger: requirements.trigger || "Daily at 9:00 AM, using the Asia/Kolkata workflow timezone. Change the Schedule Trigger in n8n to match your posting calendar.",
      implementationSteps: [
        "Use an Instagram professional account with Instagram Login and the instagram_business_content_publish permission.",
        "In the Instagram post details node, set the Instagram professional account ID, caption, and publicly accessible JPEG image URL.",
        "Create an n8n HTTP Header Auth credential with Authorization: Bearer <Instagram User access token>, then select it on both Meta HTTP Request nodes.",
        "The workflow creates an Instagram media container, then publishes that container using its returned ID.",
        "Import the workflow inactive, verify the timezone, image URL and credential, then run one manual test before activating the schedule.",
      ],
      assumptions: "This template is for a single photo post using Meta's Instagram Login API. The image must be a public JPEG URL. A professional Instagram account and valid Meta app/token with publishing permission are required. No credential or post content is embedded from your brief. Daily 9:00 AM India time is only a default; change it before activation.",
      verificationChecks: [
        "The account ID is the target Instagram professional account and the token has instagram_business_content_publish.",
        "The JPEG URL is publicly fetchable by Meta and the caption is the intended final copy.",
        "The create-container request returns an ID and the publish request succeeds.",
        "A manual run succeeds before the workflow is published and its schedule is activated.",
      ],
    };
  }

  if (isWebhookIntake) {
    const hasDestination = Boolean(requirements.destinationApp.trim()) && !/^(unknown|not sure|none|n\/a)$/i.test(requirements.destinationApp.trim());
    const hasMappings = requirements.fieldMappings.length > 0;
    const hasEndpoint = Boolean(requirements.destinationEndpoint.trim());
    const destination = hasDestination ? requirements.destinationApp : "the destination API";
    const destinationAuthName = requirements.destinationAuth === "none" ? "no authentication" : requirements.destinationAuth === "httpBasicAuth" ? "Basic Auth" : "Header Auth";
    return {
      objective: project.goal,
      trigger: requirements.trigger || "Receive an HTTP POST request at the n8n webhook endpoint.",
      implementationSteps: hasDestination ? [
        "Import the inactive n8n workflow and open the Webhook node to copy its test URL.",
        hasEndpoint ? `Review the configured destination endpoint for ${destination}; the workflow uses ${requirements.destinationMethod}, so confirm the method and request contract with that API.` : `Set the destination URL in the HTTP Request node to the exact API endpoint for the destination service. Confirm the configured ${requirements.destinationMethod} method is supported.`,
        ...(hasMappings ? ["Review the Map destination fields Code node; it copies configured source paths to destination paths, skips missing optional fields, and stops the run if a required source field is missing."] : []),
        requirements.destinationAuth === "none" ? "Confirm the destination API is intended to be public; the HTTP Request node is configured without credentials." : `Create or select the destination ${destinationAuthName} credential in n8n; AUTQORA exports no credential secret.`,
        `Send a test HTTP ${requirements.destinationMethod} with synthetic JSON and confirm the destination API accepts the forwarded payload.`,
        "Create the named Header Auth credential in n8n using the one-time value from the project security panel; bind it to the Webhook node. n8n assigns the instance-specific credential ID.",
        "Add the same header name and secret to the sending service. Keep the workflow inactive until an authenticated synthetic test succeeds.",
      ] : [
        "Import the inactive n8n workflow and open the Webhook node to copy its test URL.",
        "Send a test HTTP POST with a small JSON payload; inspect the captured body in n8n before using real data.",
        "The response node returns an accepted flag and echoes the submitted payload; replace this response with the requested processing steps.",
        "Create the named Header Auth credential in n8n using the one-time value from the project security panel; bind it to the Webhook node. n8n assigns the instance-specific credential ID.",
        "Configure the sender with the exact header name and secret. Requests with a missing or incorrect value should be rejected before the workflow starts.",
        "Publish only after an authenticated synthetic test; use the production URL only when the workflow is published and monitor n8n execution history.",
      ],
      assumptions: hasDestination
        ? hasMappings
          ? `This starter maps the configured source paths to destination paths and forwards only those defined fields with HTTP ${requirements.destinationMethod} to ${hasEndpoint ? `the configured ${destination} endpoint` : `a configurable ${destination} API endpoint`}. Destination authentication is configured as ${destinationAuthName}. Missing optional paths are skipped; a missing required path stops the workflow before forwarding. It does not implement service-specific upsert/deduplication or provider-specific API behavior. Confirm the endpoint, field contract, auth method, and error/retry policy. Configure any required credential in n8n before testing.`
          : `This starter forwards the incoming JSON body with HTTP ${requirements.destinationMethod} to ${hasEndpoint ? `the configured ${destination} endpoint` : `a configurable ${destination} API endpoint`} and returns an acknowledgement after a successful 2xx response. Destination authentication is configured as ${destinationAuthName}. It does not implement service-specific field mapping, CRM upsert/deduplication, or provider-specific API behavior. Confirm the endpoint, required fields, auth method, and error/retry policy. Configure any required credential in n8n before testing.`
        : "This starter implements an HTTP POST intake endpoint and JSON acknowledgement only; it does not yet process data in a destination app. The exported Webhook node uses Header Auth and its generated project secret. Bind the named credential in n8n, set the same header on the sender, and keep the production URL private until an authenticated synthetic test succeeds.",
      verificationChecks: hasDestination ? [
        ...(hasMappings ? ["Every configured source path maps to the intended destination path; optional missing values are omitted and required missing values stop forwarding."] : []),
        "A test POST with synthetic JSON starts one n8n execution and sends the expected payload to the destination API.",
        "The destination endpoint returns a successful 2xx response before the webhook acknowledgement is sent.",
        "An invalid destination response or timeout is visible as a failed execution; confirm retry behavior is safe before enabling it.",
        "The incoming webhook is protected and the published production URL is verified with synthetic data.",
      ] : [
        "A test POST with JSON starts one n8n execution and exposes the request body.",
        "The response is HTTP 200 JSON containing received=true and the submitted payload.",
        "A request without the header and one with an incorrect value are rejected before a workflow execution starts.",
        "The published production URL is tested with synthetic data and execution history is reviewed.",
      ],
    };
  }

  return {
    objective: project.goal,
    trigger: requirements.trigger || "Choose the real event that should start this automation (for example: a new form submission, schedule, or webhook).",
    implementationSteps: [
      `Confirm the trigger, required fields, and one representative sample record${requirements.monthlyVolume ? ` (estimated volume: ${requirements.monthlyVolume})` : ""}.`,
      `Configure the ${project.platform ?? "chosen automation platform"} trigger for ${source} and connect the source account.`,
      `Map the input fields and configure the required actions in ${destination}.`,
      "Add validation, duplicate handling, and a clear failure path before enabling the workflow.",
      "Run the verification checks below with test data, then review each external side effect before going live.",
    ],
    assumptions: `This is a starter plan generated from the saved brief without an AI model. Confirm source/destination apps (${source} → ${destination}), field mappings, access method, and data retention before implementation. Budget preference: ${requirements.budget}; technical comfort: ${requirements.technicalComfort}.${requirements.constraints ? ` User constraints: ${requirements.constraints}` : ""} Do not add credentials to this plan.`,
    verificationChecks: [
      "A valid sample input starts the workflow and reaches the expected result.",
      "Missing or malformed required data is stopped or reported safely.",
      "A retry or duplicate event does not create an unintended duplicate action.",
      "A failed step is visible and can be retried without exposing credentials or personal data.",
    ],
  };
}
