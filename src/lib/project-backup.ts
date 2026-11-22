import { z } from "zod";
import { manualWorkflowTestEvidenceSchema, projectCreateSchema, projectPlanSchema, projectSetupSchema } from "@/lib/project-domain";
import { n8nExecutionStatuses } from "@/lib/execution-evidence";
import { debugPlatforms } from "@/lib/debug-diagnostics";

const timestampSchema = z.string().datetime({ offset: true }).max(40);
const planSchema = projectPlanSchema.extend({
  projectId: z.string().uuid(),
  revision: z.number().int().positive().max(10_000),
  updatedAt: timestampSchema,
}).passthrough();
const artifactSchema = z.object({
  artifact: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    version: z.number().int().positive().max(10_000),
    name: z.string().trim().min(1).max(200),
    scenario: z.string().trim().min(1).max(120),
    sourceStatus: z.enum(["current", "stale", "unknown"]),
    createdAt: timestampSchema,
  }).strict(),
  workflow: z.record(z.string(), z.unknown()),
}).strict();
const planHistorySchema = planSchema;
const verificationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  artifactId: z.string().uuid(),
  artifactVersion: z.number().int().positive().max(10_000),
  status: z.enum(["needs_setup", "ready_for_manual_test"]),
  checks: z.array(z.object({ id: z.string().min(1).max(100), label: z.string().min(1).max(300), passed: z.boolean(), detail: z.string().max(2_000) }).strict()).max(100),
  createdAt: timestampSchema,
}).strict();
const manualEvidenceSchema = manualWorkflowTestEvidenceSchema.extend({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  artifactId: z.string().uuid(),
  artifactVersion: z.number().int().positive().max(10_000),
  reportedAt: timestampSchema,
}).strict();
const executionEvidenceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  artifactId: z.string().uuid(),
  artifactVersion: z.number().int().positive().max(10_000),
  executionId: z.string().max(100),
  reportedStatus: z.enum([...n8nExecutionStatuses, "unknown"]),
  nodeNames: z.array(z.string().max(100)).max(250),
  lastNodeExecuted: z.string().max(100).nullable(),
  failedNodes: z.array(z.string().max(100)).max(250),
  reportedAt: timestampSchema,
}).strict();
const debugDiagnosisSchema = z.object({
  category: z.string().max(100),
  summary: z.string().max(500),
  explanation: z.string().max(4_000),
  steps: z.array(z.string().max(1_000)).max(20),
  evidence: z.string().max(2_000),
  note: z.string().max(2_000),
  workflowReview: z.object({
    nodeCount: z.number().int().nonnegative().max(500),
    issues: z.array(z.string().max(1_000)).max(30),
    securityNotes: z.array(z.string().max(1_000)).max(30),
  }).strict().optional(),
  projectContext: z.object({
    workflowVersion: z.number().int().nonnegative().max(10_000),
    scenario: z.string().max(120),
    localVerificationStatus: z.enum(["needs_setup", "ready_for_manual_test"]).nullable(),
    failedLocalChecks: z.array(z.string().max(300)).max(100),
    importedExecution: z.object({
      reportedStatus: z.enum([...n8nExecutionStatuses, "unknown"]),
      nodeNames: z.array(z.string().max(100)).max(250),
      lastNodeExecuted: z.string().max(100).nullable(),
      failedNodes: z.array(z.string().max(100)).max(250),
    }).strict().nullable().optional(),
    recentDebugOutcomes: z.array(z.object({
      category: z.string().max(100),
      stepIndex: z.number().int().nonnegative().max(20),
      step: z.string().max(500),
      status: z.enum(["tried", "resolved", "still_failing", "not_applicable"]),
      note: z.string().max(500),
      updatedAt: timestampSchema,
    }).strict()).max(12).optional(),
  }).strict().optional(),
}).strict();
const debugStepFeedbackSchema = z.object({
  stepIndex: z.number().int().nonnegative().max(20),
  status: z.enum(["not_started", "tried", "resolved", "still_failing", "not_applicable"]),
  note: z.string().max(500),
  updatedAt: timestampSchema,
}).strict();
const debugReportSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  platform: z.enum(debugPlatforms),
  error: z.string().max(8_000),
  expected: z.string().max(1_000),
  diagnosis: debugDiagnosisSchema,
  stepFeedback: z.array(debugStepFeedbackSchema).max(20).optional().default([]),
  createdAt: timestampSchema,
}).strict();

export const projectBackupImportSchema = z.object({
  format: z.literal("autqora-project-backup"),
  version: z.literal(1),
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    goal: z.string(),
    platform: z.enum(["n8n", "Make", "Zapier", "Python", "Other"]).nullable(),
    status: z.enum(["draft", "planning", "building", "verification", "complete"]),
    requirements: z.unknown(),
  }).passthrough(),
  plan: planSchema.nullable(),
  planFreshness: z.enum(["draft", "current", "requirements_changed", "unknown"]),
  planHistory: z.array(planHistorySchema).max(50),
  setup: projectSetupSchema.shape.checks,
  workflowVersions: z.array(artifactSchema).max(20),
  verificationReports: z.array(verificationSchema).max(10),
  manualTestEvidence: z.array(manualEvidenceSchema).max(20),
  importedExecutionSummaries: z.array(executionEvidenceSchema).max(20),
  debugReports: z.array(debugReportSchema).max(20),
}).passthrough().superRefine((backup, context) => {
  const project = projectCreateSchema.safeParse({
    name: backup.project.name,
    goal: backup.project.goal,
    platform: backup.project.platform,
    requirements: backup.project.requirements,
  });
  if (!project.success) context.addIssue({ code: "custom", path: ["project"], message: "The project brief or requirements are invalid." });

  if (backup.plan && backup.plan.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["plan", "projectId"], message: "The saved plan belongs to a different project." });

  const revisions = new Set<number>();
  for (const [index, plan] of backup.planHistory.entries()) {
    if (plan.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["planHistory", index, "projectId"], message: "Plan revision belongs to a different project." });
    if (revisions.has(plan.revision)) context.addIssue({ code: "custom", path: ["planHistory", index, "revision"], message: "Plan revisions must be unique." });
    revisions.add(plan.revision);
  }

  const versions = new Set<number>();
  const artifactIds = new Map<string, number>();
  for (const [index, item] of backup.workflowVersions.entries()) {
    if (item.artifact.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["workflowVersions", index, "artifact", "projectId"], message: "Workflow version belongs to a different project." });
    if (versions.has(item.artifact.version)) context.addIssue({ code: "custom", path: ["workflowVersions", index, "artifact", "version"], message: "Workflow versions must be unique." });
    versions.add(item.artifact.version);
    artifactIds.set(item.artifact.id, item.artifact.version);
  }
  const linkedRecords = [
    ["verificationReports", backup.verificationReports],
    ["manualTestEvidence", backup.manualTestEvidence],
    ["importedExecutionSummaries", backup.importedExecutionSummaries],
  ] as const;
  for (const [field, records] of linkedRecords) {
    for (const [index, record] of records.entries()) {
      if (record.projectId !== backup.project.id) context.addIssue({ code: "custom", path: [field, index, "projectId"], message: "Evidence belongs to a different project." });
      if (artifactIds.get(record.artifactId) !== record.artifactVersion) context.addIssue({ code: "custom", path: [field, index, "artifactId"], message: "Evidence must reference a workflow version in this backup." });
    }
  }
  for (const [index, report] of backup.debugReports.entries()) {
    if (report.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["debugReports", index, "projectId"], message: "Debug report belongs to a different project." });
    const feedbackIndexes = new Set<number>();
    for (const [feedbackIndex, feedback] of report.stepFeedback.entries()) {
      if (feedback.stepIndex >= report.diagnosis.steps.length) context.addIssue({ code: "custom", path: ["debugReports", index, "stepFeedback", feedbackIndex, "stepIndex"], message: "Debug feedback references a missing recommendation step." });
      if (feedbackIndexes.has(feedback.stepIndex)) context.addIssue({ code: "custom", path: ["debugReports", index, "stepFeedback", feedbackIndex, "stepIndex"], message: "Debug feedback step indexes must be unique." });
      feedbackIndexes.add(feedback.stepIndex);
    }
  }
});

export type ProjectBackupImport = z.infer<typeof projectBackupImportSchema>;

export function backupContainsCredentialMaterial(value: unknown): boolean {
  const credentialKey = /^(authorization|password|access[_-]?token|refresh[_-]?token|client[_-]?secret|api[_-]?key|secret)$/i;
  const secretText = /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password)\s*[:=]\s*["']?[^\s"']{8,}/i;
  const pending: unknown[] = [value];
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === "string" && secretText.test(item)) return true;
    if (Array.isArray(item)) {
      for (const child of item) pending.push(child);
    }
    else if (item && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) {
        if (credentialKey.test(key)) return true;
        pending.push(child);
      }
    }
  }
  return false;
}
