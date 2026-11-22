export const debugPlatforms = ["n8n", "Make", "Zapier", "Python", "REST API", "Other"] as const;

export type DebugPlatform = (typeof debugPlatforms)[number];

export type DebugDiagnosis = {
  category: string;
  summary: string;
  explanation: string;
  steps: string[];
  evidence: string;
  note: string;
  screenshotAnalyzed?: boolean;
  workflowReview?: import("@/lib/project-workflow").WorkflowDebugReview;
  projectContext?: {
    workflowVersion: number;
    scenario: string;
    localVerificationStatus: "needs_setup" | "ready_for_manual_test" | null;
    failedLocalChecks: string[];
    importedExecution?: {
      reportedStatus: import("@/lib/execution-evidence").N8nExecutionStatus;
      nodeNames: string[];
      lastNodeExecuted: string | null;
      failedNodes: string[];
    } | null;
    recentDebugOutcomes?: Array<{
      category: string;
      stepIndex: number;
      step: string;
      status: "tried" | "resolved" | "still_failing" | "not_applicable";
      note: string;
      updatedAt: string;
    }>;
  };
};

type Rule = {
  matches: RegExp;
  category: string;
  summary: string;
  explanation: string;
  steps: string[];
  evidence: string;
};

const rules: Rule[] = [
  {
    matches: /401|403|unauthori[sz]ed|forbidden|invalid_grant|token.{0,20}expir|authentication|permission denied/i,
    category: "Authentication or permissions",
    summary: "The request may be reaching the service without a valid or sufficiently privileged credential.",
    explanation: "A 401 or 403, an expired-token message, or a permission error usually points to authentication, token lifetime, or missing scopes. The log alone cannot tell which one applies.",
    steps: [
      "Reconnect the account in the platform that owns the credential; never paste the token here.",
      "Confirm the connected account has the specific permission required by the failing action.",
      "Retry one safe test record and check whether the response changes from 401/403.",
    ],
    evidence: "Capture the HTTP status, service error code, and the failing action name. Remove authorization headers and tokens first.",
  },
  {
    matches: /429|rate.?limit|too many requests|throttl|quota exceeded/i,
    category: "Rate limit or quota",
    summary: "The service may be limiting requests or the account may have reached a quota.",
    explanation: "A 429 or quota message usually means the workflow is sending requests faster than the service allows, or the account limit has been reached.",
    steps: [
      "Check the provider response for a Retry-After value or quota reset time.",
      "Reduce parallel runs and add bounded backoff between retries.",
      "Make write steps idempotent so a retry cannot create duplicate records.",
    ],
    evidence: "Compare request timestamps, run concurrency, and the provider’s quota response.",
  },
  {
    matches: /404|not found|does not exist|doesn't exist|unknown resource|referenced node/i,
    category: "Missing resource or reference",
    summary: "A URL, record, workflow reference, or resource identifier may not resolve in this environment.",
    explanation: "A 404 or missing-reference message can come from a stale ID, a changed node name, or using a resource from a different workspace or environment.",
    steps: [
      "Check the exact URL, record ID, and node or step name used by the failing action.",
      "Confirm the resource exists in the same account and environment as the credential.",
      "Run the step with a known-good test ID before replaying the whole workflow.",
    ],
    evidence: "Capture the sanitized endpoint path and resource type; omit query strings that may contain tokens.",
  },
  {
    matches: /timeout|timed out|etimedout|econnreset|econnrefused|502|503|504|service unavailable|gateway/i,
    category: "Timeout or unavailable service",
    summary: "The remote service or network may not have responded in time.",
    explanation: "Timeouts and 5xx responses often come from temporary service trouble, slow upstream work, or a network interruption. They do not prove the request was never processed.",
    steps: [
      "Check the provider status and compare the failure time with other successful runs.",
      "Use a bounded retry with backoff only for actions that are safe to repeat.",
      "For create or payment actions, check whether the first request succeeded before retrying.",
    ],
    evidence: "Record the timestamp, duration, status code, and a provider request ID if one is present.",
  },
  {
    matches: /json.?parse|unexpected token|unexpected end of json|invalid json|malformed json|parse error/i,
    category: "Invalid or unexpected data format",
    summary: "A step may be parsing a response that is empty, malformed, or shaped differently than expected.",
    explanation: "Parsing errors commonly happen when a response is not JSON, a field is empty, or an upstream API changed its response shape.",
    steps: [
      "Inspect the response status and Content-Type before parsing the body.",
      "Compare one failing response with a known-good response and check required fields.",
      "Handle empty or non-JSON responses explicitly instead of assuming every response is JSON.",
    ],
    evidence: "Share a small sanitized sample of the response shape, with personal data and secrets removed.",
  },
  {
    matches: /cannot read propert|undefined|null reference|missing field|keyerror|key error|none type|no such key/i,
    category: "Missing field or data mapping",
    summary: "The workflow may be reading a field that is absent or named differently in this run.",
    explanation: "This often happens when an upstream step returns an optional field, a different payload shape, or an empty result for some records.",
    steps: [
      "Inspect the input and output of the step immediately before the failure.",
      "Verify the field path and exact spelling against a failing sample record.",
      "Add an explicit empty-value branch or default before using the field.",
    ],
    evidence: "Provide the sanitized field path and a minimal example of the input shape that failed.",
  },
  {
    matches: /duplicate|already exists|idempotency|already been taken/i,
    category: "Duplicate or repeated action",
    summary: "A retry or repeated trigger may be processing the same event more than once.",
    explanation: "Duplicate messages usually point to repeated delivery, a retry after an uncertain response, or a missing deduplication key.",
    steps: [
      "Identify a stable event or record ID that can serve as a deduplication key.",
      "Check whether the trigger delivered the same event more than once.",
      "Add an idempotency check before the write and confirm it with a replay.",
    ],
    evidence: "Compare event IDs and timestamps across the original run and its retries.",
  },
];

const secretPatterns = [
  /(\b(?:authorization\s*[:=]\s*bearer)\s+)[^\s,;]+/gi,
  /(\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|secret)\b\s*[:=]\s*["']?)[^\s"',;]+/gi,
  /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/g,
];

export function redactSecrets(input: string) {
  return secretPatterns.reduce(
    (text, pattern) => text.replace(pattern, "$1[REDACTED]"),
    input
  );
}

export function diagnoseWorkflowError(platform: DebugPlatform, error: string, expected: string): DebugDiagnosis {
  const safeError = redactSecrets(error);
  const matchingRule = rules.find((rule) => rule.matches.test(safeError));

  if (platform === "n8n" && /referenced node|node.{0,20}does not exist|node.{0,20}doesn't exist/i.test(safeError)) {
    return {
      category: "Workflow node reference",
      summary: "An expression may refer to a node name that changed or is not available in this execution path.",
      explanation: "In n8n, expressions can depend on exact node names and execution context. A renamed, skipped, or unexecuted node can leave a reference unresolved.",
      steps: [
        "Open the expression and confirm the referenced node name matches the canvas exactly.",
        "Check that the referenced node ran earlier on this same branch.",
        "Test the expression with a pinned sample from the previous node.",
      ],
      evidence: "Capture the expression and the upstream node output, with personal data and credentials removed.",
      note: expected.trim() ? `Compare the test output with your expected result: ${expected.trim().slice(0, 240)}` : "This is a rule-based suggestion. Confirm the node reference in the workflow editor.",
    };
  }

  if (!matchingRule) {
    return {
      category: "More context needed",
      summary: "I couldn’t match this error to a known pattern yet.",
      explanation: `This first version checks common error patterns for ${platform}. It does not inspect your workflow file or call the platform API.`,
      steps: [
        "Find the first failing step and copy its exact error code and message.",
        "Compare that step’s input and output with a successful run, if available.",
        "Check for a recent change to credentials, field mappings, or the endpoint.",
      ],
      evidence: "Add the failing step name, status code, and a short sanitized input/output example to get a more specific match.",
      note: expected.trim() ? `Expected result: ${expected.trim().slice(0, 240)}` : "No workflow file was uploaded or stored.",
    };
  }

  return {
    category: matchingRule.category,
    summary: matchingRule.summary,
    explanation: matchingRule.explanation,
    steps: matchingRule.steps,
    evidence: matchingRule.evidence,
    note: expected.trim()
      ? `After each change, compare the result with: ${expected.trim().slice(0, 240)}`
      : "This is a rule-based suggestion, not a confirmed root cause. Test one change at a time.",
  };
}
