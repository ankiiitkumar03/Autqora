import { z } from "zod";
import { projectCreateSchema, projectPlanSchema, projectSetupSchema } from "@/lib/project-domain";

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
  setup: projectSetupSchema.shape.checks,
  workflowVersions: z.array(artifactSchema).max(20),
}).passthrough().superRefine((backup, context) => {
  const project = projectCreateSchema.safeParse({
    name: backup.project.name,
    goal: backup.project.goal,
    platform: backup.project.platform,
    requirements: backup.project.requirements,
  });
  if (!project.success) context.addIssue({ code: "custom", path: ["project"], message: "The project brief or requirements are invalid." });

  if (backup.plan && backup.plan.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["plan", "projectId"], message: "The saved plan belongs to a different project." });

  const versions = new Set<number>();
  for (const [index, item] of backup.workflowVersions.entries()) {
    if (item.artifact.projectId !== backup.project.id) context.addIssue({ code: "custom", path: ["workflowVersions", index, "artifact", "projectId"], message: "Workflow version belongs to a different project." });
    if (versions.has(item.artifact.version)) context.addIssue({ code: "custom", path: ["workflowVersions", index, "artifact", "version"], message: "Workflow versions must be unique." });
    versions.add(item.artifact.version);
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
