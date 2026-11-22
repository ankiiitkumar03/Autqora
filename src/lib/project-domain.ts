import { z } from "zod";

export const projectPlatforms = ["n8n", "Make", "Zapier", "Python", "Other"] as const;
export const projectStatuses = ["draft", "planning", "building", "verification", "complete"] as const;
export const projectBudgets = ["free", "under_25", "under_100", "flexible", "unknown"] as const;
export const technicalComfortLevels = ["beginner", "comfortable", "advanced", "unknown"] as const;

const mappingPathSchema = z.string().trim().min(1).max(160)
  .regex(/^[A-Za-z0-9_$-]+(?:\.[A-Za-z0-9_$-]+)*$/, "Use dot notation for field paths, such as body.email.")
  .refine((path) => !path.split(".").some((part) => ["__proto__", "prototype", "constructor"].includes(part)), "This field path is reserved.");

export const projectFieldMappingSchema = z.object({ sourcePath: mappingPathSchema, targetPath: mappingPathSchema, required: z.boolean().default(false) }).strict();

export const projectRequirementsSchema = z.object({
  trigger: z.string().trim().max(500).default(""),
  sourceApp: z.string().trim().max(100).default(""),
  destinationApp: z.string().trim().max(100).default(""),
  destinationEndpoint: z.string().trim().max(500).default("").superRefine((value, context) => {
    if (!value) return;
    let endpoint: URL;
    try { endpoint = new URL(value); } catch { context.addIssue({ code: "custom", message: "Enter a valid destination API URL." }); return; }
    const localHttpHosts = new Set(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]);
    if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && localHttpHosts.has(endpoint.hostname.toLowerCase()))) {
      context.addIssue({ code: "custom", message: "Use HTTPS for destination APIs. HTTP is allowed only for localhost or host.docker.internal development endpoints." });
    }
    if (endpoint.username || endpoint.password) context.addIssue({ code: "custom", message: "Do not put credentials in the endpoint URL; configure them in n8n." });
    if (endpoint.hash) context.addIssue({ code: "custom", message: "Remove the URL fragment from the API endpoint." });
    if ([...endpoint.searchParams.keys()].some((key) => /(api.?key|token|secret|password|authorization|auth)/i.test(key))) {
      context.addIssue({ code: "custom", message: "Do not put credentials in endpoint query parameters; configure them in n8n." });
    }
  }),
  destinationMethod: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  destinationAuth: z.enum(["none", "httpHeaderAuth", "httpBasicAuth"]).default("httpHeaderAuth"),
  fieldMappings: z.array(projectFieldMappingSchema).max(20).default([]).superRefine((mappings, context) => {
    mappings.forEach((mapping, index) => {
      for (const [otherIndex, other] of mappings.entries()) {
        if (otherIndex >= index) continue;
        if (other.targetPath === mapping.targetPath) {
          context.addIssue({ code: "custom", path: [index, "targetPath"], message: "Each destination path can only be mapped once." });
        } else if (other.targetPath.startsWith(`${mapping.targetPath}.`) || mapping.targetPath.startsWith(`${other.targetPath}.`)) {
          context.addIssue({ code: "custom", path: [index, "targetPath"], message: "Destination paths cannot overlap as parent and child fields." });
        }
      }
    });
  }),
  monthlyVolume: z.string().trim().max(100).default(""),
  budget: z.enum(projectBudgets).default("unknown"),
  technicalComfort: z.enum(technicalComfortLevels).default("unknown"),
  constraints: z.string().trim().max(1_000).default(""),
}).strict();

export const projectCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    goal: z.string().trim().min(10).max(4_000),
    platform: z.enum(projectPlatforms).nullable().optional().default(null),
    requirements: projectRequirementsSchema.optional().default({
      trigger: "", sourceApp: "", destinationApp: "", destinationEndpoint: "", destinationMethod: "POST", destinationAuth: "httpHeaderAuth", fieldMappings: [], monthlyVolume: "", budget: "unknown", technicalComfort: "unknown", constraints: "",
    }),
  })
  .strict();

export const projectUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    goal: z.string().trim().min(10).max(4_000).optional(),
    platform: z.enum(projectPlatforms).nullable().optional(),
    status: z.enum(projectStatuses).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export type ProjectPlatform = (typeof projectPlatforms)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectRequirements = z.infer<typeof projectRequirementsSchema>;

export type Project = {
  id: string;
  name: string;
  goal: string;
  platform: ProjectPlatform | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  requirements: ProjectRequirements;
};

export const projectPlanSchema = z.object({
  objective: z.string().trim().min(10).max(2_000),
  trigger: z.string().trim().min(3).max(1_000),
  implementationSteps: z.array(z.string().trim().min(3).max(500)).min(1).max(20),
  assumptions: z.string().trim().max(2_000),
  verificationChecks: z.array(z.string().trim().min(3).max(500)).min(1).max(20),
}).strict();

export type ProjectPlanInput = z.infer<typeof projectPlanSchema>;
export type ProjectPlan = ProjectPlanInput & {
  projectId: string;
  revision: number;
  updatedAt: string;
};

export type ProjectPlanFreshness = "draft" | "current" | "requirements_changed" | "unknown";

export const setupCheckIds = ["workflow_imported", "fields_configured", "credentials_connected", "schedule_checked", "test_reviewed"] as const;
export const projectSetupSchema = z.object({
  checks: z.object({
    workflow_imported: z.boolean(),
    fields_configured: z.boolean(),
    credentials_connected: z.boolean(),
    schedule_checked: z.boolean(),
    test_reviewed: z.boolean(),
  }).strict(),
}).strict();
export type ProjectSetup = z.infer<typeof projectSetupSchema>["checks"];

export type WorkflowArtifact = {
  id: string;
  projectId: string;
  version: number;
  name: string;
  scenario: string;
  sourceStatus: "current" | "stale" | "unknown";
  createdAt: string;
};

export type ProjectDebugReport = {
  id: string;
  projectId: string;
  platform: string;
  error: string;
  expected: string;
  diagnosis: import("@/lib/debug-diagnostics").DebugDiagnosis;
  createdAt: string;
};

export type WorkflowVerification = {
  id: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  status: "needs_setup" | "ready_for_manual_test";
  checks: Array<{ id: string; label: string; passed: boolean; detail: string }>;
  createdAt: string;
};

export const manualWorkflowTestEvidenceSchema = z.object({
  result: z.enum(["passed", "failed", "blocked"]),
  environment: z.enum(["n8n_test_url", "n8n_production_url", "other"]),
  summary: z.string().trim().min(10).max(2_000),
  executionReference: z.string().trim().max(200).optional().default(""),
}).strict();

export type ManualWorkflowTestEvidenceInput = z.infer<typeof manualWorkflowTestEvidenceSchema>;
export type ManualWorkflowTestEvidence = ManualWorkflowTestEvidenceInput & {
  id: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  reportedAt: string;
};

export type N8nExecutionEvidence = {
  id: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  executionId: string;
  reportedStatus: import("@/lib/execution-evidence").N8nExecutionStatus;
  nodeNames: string[];
  lastNodeExecuted: string | null;
  failedNodes: string[];
  reportedAt: string;
};

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
