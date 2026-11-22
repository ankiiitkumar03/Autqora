import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { projectFieldMappingSchema } from "@/lib/project-domain";
import type {
  Project,
  ProjectCreateInput,
  ProjectPlan,
  ProjectPlanFreshness,
  ProjectPlanInput,
  ProjectSetup,
  WorkflowArtifact,
  ProjectDebugReport,
  ProjectPlatform,
  ProjectStatus,
  ProjectUpdateInput,
  ProjectRequirements,
  WorkflowVerification,
  ManualWorkflowTestEvidence,
  ManualWorkflowTestEvidenceInput,
  N8nExecutionEvidence,
} from "@/lib/project-domain";
import type { DebugDiagnosis, DebugPlatform } from "@/lib/debug-diagnostics";
import type { ProjectBackupImport } from "@/lib/project-backup";

type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  goal: string;
  platform: ProjectPlatform | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export class ProjectLimitError extends Error {
  constructor() {
    super("This workspace has reached its 100-project limit.");
    this.name = "ProjectLimitError";
  }
}

const globalForSqlite = globalThis as typeof globalThis & {
  autqoraDatabase?: DatabaseSync;
};

function database() {
  if (globalForSqlite.autqoraDatabase) return globalForSqlite.autqoraDatabase;

  const databasePath = process.env.AUTQORA_DB_PATH ?? join(process.cwd(), "data", "autqora.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
      goal TEXT NOT NULL CHECK(length(goal) BETWEEN 10 AND 4000),
      platform TEXT CHECK(platform IS NULL OR platform IN ('n8n', 'Make', 'Zapier', 'Python', 'Other')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'planning', 'building', 'verification', 'complete')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS projects_workspace_updated
      ON projects(workspace_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS project_requirements (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      trigger_text TEXT NOT NULL DEFAULT '',
      source_app TEXT NOT NULL DEFAULT '',
      destination_app TEXT NOT NULL DEFAULT '',
      destination_endpoint TEXT NOT NULL DEFAULT '',
      destination_method TEXT NOT NULL DEFAULT 'POST',
      destination_auth TEXT NOT NULL DEFAULT 'httpHeaderAuth',
      field_mappings_text TEXT NOT NULL DEFAULT '[]',
      monthly_volume TEXT NOT NULL DEFAULT '',
      budget TEXT NOT NULL DEFAULT 'unknown',
      technical_comfort TEXT NOT NULL DEFAULT 'unknown',
      constraints_text TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_plans (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      objective TEXT NOT NULL,
      trigger_text TEXT NOT NULL,
      implementation_steps TEXT NOT NULL,
      assumptions TEXT NOT NULL,
      verification_checks TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_plan_requirement_context (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      requirements_fingerprint TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_plan_versions (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      objective TEXT NOT NULL,
      trigger_text TEXT NOT NULL,
      implementation_steps TEXT NOT NULL,
      assumptions TEXT NOT NULL,
      verification_checks TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(project_id, revision)
    );
    CREATE TABLE IF NOT EXISTS project_setup (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      checks_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_webhook_secrets (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      secret_hash TEXT NOT NULL,
      header_name TEXT NOT NULL,
      credential_name TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_workflow_artifacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      scenario TEXT NOT NULL,
      workflow_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(project_id, version)
    );
    CREATE TABLE IF NOT EXISTS project_setup_artifact_context (
      project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      artifact_id TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_workflow_source_context (
      artifact_id TEXT PRIMARY KEY REFERENCES project_workflow_artifacts(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      source_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS workflow_artifacts_project_version
      ON project_workflow_artifacts(workspace_id, project_id, version DESC);
    CREATE TABLE IF NOT EXISTS project_workflow_verifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      artifact_id TEXT NOT NULL REFERENCES project_workflow_artifacts(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      artifact_version INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('needs_setup', 'ready_for_manual_test')),
      checks_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_manual_workflow_evidence (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      artifact_id TEXT NOT NULL REFERENCES project_workflow_artifacts(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      artifact_version INTEGER NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('passed', 'failed', 'blocked')),
      environment TEXT NOT NULL CHECK(environment IN ('n8n_test_url', 'n8n_production_url', 'other')),
      summary TEXT NOT NULL,
      execution_reference TEXT NOT NULL DEFAULT '',
      reported_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS project_manual_evidence_recent
      ON project_manual_workflow_evidence(workspace_id, project_id, reported_at DESC);
    CREATE TABLE IF NOT EXISTS project_n8n_execution_evidence (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      artifact_id TEXT NOT NULL REFERENCES project_workflow_artifacts(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      artifact_version INTEGER NOT NULL,
      execution_id TEXT NOT NULL DEFAULT '',
      reported_status TEXT NOT NULL,
      node_names_json TEXT NOT NULL,
      last_node_executed TEXT,
      failed_nodes_json TEXT NOT NULL,
      reported_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS project_n8n_execution_evidence_recent
      ON project_n8n_execution_evidence(workspace_id, project_id, reported_at DESC);
    CREATE TABLE IF NOT EXISTS project_debug_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      error_text TEXT NOT NULL,
      expected TEXT NOT NULL,
      diagnosis_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS project_debug_reports_recent
      ON project_debug_reports(workspace_id, project_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      workspace_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS user_sessions_user_expiry ON user_sessions(user_id, expires_at);
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      key_hash TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL
    );
  `);

  const requirementColumns = db.prepare("PRAGMA table_info(project_requirements)").all() as Array<{ name: string }>;
  if (!requirementColumns.some((column) => column.name === "field_mappings_text")) {
    db.exec("ALTER TABLE project_requirements ADD COLUMN field_mappings_text TEXT NOT NULL DEFAULT '[]'");
  }
  if (!requirementColumns.some((column) => column.name === "destination_endpoint")) {
    db.exec("ALTER TABLE project_requirements ADD COLUMN destination_endpoint TEXT NOT NULL DEFAULT ''");
  }
  if (!requirementColumns.some((column) => column.name === "destination_method")) {
    db.exec("ALTER TABLE project_requirements ADD COLUMN destination_method TEXT NOT NULL DEFAULT 'POST'");
  }
  if (!requirementColumns.some((column) => column.name === "destination_auth")) {
    db.exec("ALTER TABLE project_requirements ADD COLUMN destination_auth TEXT NOT NULL DEFAULT 'httpHeaderAuth'");
  }

  globalForSqlite.autqoraDatabase = db;
  return db;
}

function toProject(row: ProjectRow): Project {
  const requirements = getProjectRequirements(row.workspace_id, row.id);
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    platform: row.platform,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requirements,
  };
}

export function listProjects(workspaceId: string) {
  const rows = database()
    .prepare("SELECT * FROM projects WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 100")
    .all(workspaceId) as unknown as ProjectRow[];
  return rows.map(toProject);
}

export function countProjects(workspaceId: string) {
  const row = database()
    .prepare("SELECT COUNT(*) AS count FROM projects WHERE workspace_id = ?")
    .get(workspaceId) as { count: number | bigint };
  return Number(row.count);
}

export function createProject(workspaceId: string, input: ProjectCreateInput) {
  const db = database();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.exec("BEGIN IMMEDIATE");
  try {
    const count = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE workspace_id = ?").get(workspaceId) as { count: number | bigint };
    if (Number(count.count) >= 100) throw new ProjectLimitError();
    db.prepare(
      `INSERT INTO projects (id, workspace_id, name, goal, platform, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`
    ).run(id, workspaceId, input.name, input.goal, input.platform ?? null, now, now);
    saveProjectRequirements(workspaceId, id, input.requirements);
    const project = getProject(workspaceId, id);
    if (!project) throw new Error("Created project could not be loaded.");
    db.exec("COMMIT");
    return project;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function importProjectBackup(workspaceId: string, backup: ProjectBackupImport) {
  const db = database();
  const projectId = randomUUID();
  const now = new Date().toISOString();
  const input = {
    name: backup.project.name,
    goal: backup.project.goal,
    platform: backup.project.platform,
    requirements: backup.project.requirements,
  } as ProjectCreateInput;
  db.exec("BEGIN IMMEDIATE");
  try {
    const count = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE workspace_id = ?").get(workspaceId) as { count: number | bigint };
    if (Number(count.count) >= 100) throw new ProjectLimitError();
    db.prepare(
      "INSERT INTO projects (id, workspace_id, name, goal, platform, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(projectId, workspaceId, input.name, input.goal, input.platform ?? null, backup.project.status, now, now);
    saveProjectRequirements(workspaceId, projectId, input.requirements);

    if (backup.plan) {
      const { revision, updatedAt, objective, trigger, implementationSteps, assumptions, verificationChecks } = backup.plan;
      db.prepare(
        "INSERT INTO project_plans (project_id, workspace_id, objective, trigger_text, implementation_steps, assumptions, verification_checks, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(projectId, workspaceId, objective, trigger, JSON.stringify(implementationSteps), assumptions, JSON.stringify(verificationChecks), revision, updatedAt);
      db.prepare(
        "INSERT INTO project_plan_versions (project_id, workspace_id, revision, objective, trigger_text, implementation_steps, assumptions, verification_checks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(projectId, workspaceId, revision, objective, trigger, JSON.stringify(implementationSteps), assumptions, JSON.stringify(verificationChecks), updatedAt);
      if (backup.planFreshness === "current") saveProjectPlanRequirementContext(workspaceId, projectId, db);
      else if (backup.planFreshness === "requirements_changed") {
        db.prepare("INSERT INTO project_plan_requirement_context (project_id, workspace_id, requirements_fingerprint, updated_at) VALUES (?, ?, ?, ?)")
          .run(projectId, workspaceId, "imported-requirements-changed", now);
      }
    }

    const artifactIds = new Map<string, string>();
    const fingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
    for (const item of [...backup.workflowVersions].sort((a, b) => a.artifact.version - b.artifact.version)) {
      const artifactId = randomUUID();
      artifactIds.set(item.artifact.id, artifactId);
      db.prepare(
        "INSERT INTO project_workflow_artifacts (id, project_id, workspace_id, version, name, scenario, workflow_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(artifactId, projectId, workspaceId, item.artifact.version, item.artifact.name, item.artifact.scenario, JSON.stringify(item.workflow), item.artifact.createdAt);
      if (fingerprint && item.artifact.sourceStatus !== "unknown") {
        const importedFingerprint = item.artifact.sourceStatus === "current" ? fingerprint : `imported-stale:${fingerprint}`;
        db.prepare("INSERT INTO project_workflow_source_context (artifact_id, workspace_id, source_fingerprint, created_at) VALUES (?, ?, ?, ?)")
          .run(artifactId, workspaceId, importedFingerprint, item.artifact.createdAt);
      }
    }

    db.prepare("INSERT INTO project_setup (project_id, workspace_id, checks_json, updated_at) VALUES (?, ?, ?, ?)")
      .run(projectId, workspaceId, JSON.stringify(backup.setup), now);
    const latestArtifactId = [...backup.workflowVersions].sort((a, b) => b.artifact.version - a.artifact.version)[0];
    db.prepare("INSERT INTO project_setup_artifact_context (project_id, workspace_id, artifact_id, updated_at) VALUES (?, ?, ?, ?)")
      .run(projectId, workspaceId, latestArtifactId ? artifactIds.get(latestArtifactId.artifact.id) ?? null : null, now);

    const project = getProject(workspaceId, projectId);
    if (!project) throw new Error("Imported project could not be loaded.");
    db.exec("COMMIT");
    return { project, workflowVersionsImported: artifactIds.size };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const defaultRequirements: ProjectRequirements = {
  trigger: "", sourceApp: "", destinationApp: "", destinationEndpoint: "", destinationMethod: "POST", destinationAuth: "httpHeaderAuth", fieldMappings: [], monthlyVolume: "", budget: "unknown", technicalComfort: "unknown", constraints: "",
};

export function getProjectRequirements(workspaceId: string, projectId: string): ProjectRequirements {
  const row = database().prepare("SELECT * FROM project_requirements WHERE workspace_id = ? AND project_id = ?")
    .get(workspaceId, projectId) as { trigger_text: string; source_app: string; destination_app: string; destination_endpoint: string; destination_method: ProjectRequirements["destinationMethod"]; destination_auth: ProjectRequirements["destinationAuth"]; field_mappings_text: string; monthly_volume: string; budget: ProjectRequirements["budget"]; technical_comfort: ProjectRequirements["technicalComfort"]; constraints_text: string } | undefined;
  if (!row) return defaultRequirements;
  return { trigger: row.trigger_text, sourceApp: row.source_app, destinationApp: row.destination_app, destinationEndpoint: row.destination_endpoint, destinationMethod: row.destination_method, destinationAuth: row.destination_auth, fieldMappings: projectFieldMappingSchema.array().parse(JSON.parse(row.field_mappings_text)), monthlyVolume: row.monthly_volume, budget: row.budget, technicalComfort: row.technical_comfort, constraints: row.constraints_text };
}

export function saveProjectRequirements(workspaceId: string, projectId: string, requirements: ProjectRequirements) {
  database().prepare(
    `INSERT INTO project_requirements (project_id, workspace_id, trigger_text, source_app, destination_app, destination_endpoint, destination_method, destination_auth, field_mappings_text, monthly_volume, budget, technical_comfort, constraints_text, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET trigger_text=excluded.trigger_text, source_app=excluded.source_app, destination_app=excluded.destination_app, destination_endpoint=excluded.destination_endpoint, destination_method=excluded.destination_method, destination_auth=excluded.destination_auth, field_mappings_text=excluded.field_mappings_text, monthly_volume=excluded.monthly_volume, budget=excluded.budget, technical_comfort=excluded.technical_comfort, constraints_text=excluded.constraints_text, updated_at=excluded.updated_at
     WHERE project_requirements.workspace_id=excluded.workspace_id`
  ).run(projectId, workspaceId, requirements.trigger, requirements.sourceApp, requirements.destinationApp, requirements.destinationEndpoint, requirements.destinationMethod, requirements.destinationAuth, JSON.stringify(requirements.fieldMappings), requirements.monthlyVolume, requirements.budget, requirements.technicalComfort, requirements.constraints, new Date().toISOString());
  return getProjectRequirements(workspaceId, projectId);
}

export function getProject(workspaceId: string, projectId: string) {
  const row = database()
    .prepare("SELECT * FROM projects WHERE workspace_id = ? AND id = ?")
    .get(workspaceId, projectId) as unknown as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

export function updateProject(workspaceId: string, projectId: string, input: ProjectUpdateInput) {
  const current = getProject(workspaceId, projectId);
  if (!current) return null;

  const next = {
    name: input.name ?? current.name,
    goal: input.goal ?? current.goal,
    platform: input.platform === undefined ? current.platform : input.platform,
    status: input.status ?? current.status,
  };

  database()
    .prepare(
      `UPDATE projects SET name = ?, goal = ?, platform = ?, status = ?, updated_at = ?
       WHERE workspace_id = ? AND id = ?`
    )
    .run(next.name, next.goal, next.platform, next.status, new Date().toISOString(), workspaceId, projectId);

  return getProject(workspaceId, projectId);
}

export function deleteProject(workspaceId: string, projectId: string) {
  const result = database()
    .prepare("DELETE FROM projects WHERE workspace_id = ? AND id = ?")
    .run(workspaceId, projectId) as { changes: number | bigint };
  return Number(result.changes) > 0;
}

type ProjectPlanRow = {
  project_id: string;
  workspace_id: string;
  objective: string;
  trigger_text: string;
  implementation_steps: string;
  assumptions: string;
  verification_checks: string;
  revision: number;
  updated_at: string;
};

function toProjectPlan(row: ProjectPlanRow): ProjectPlan {
  return {
    projectId: row.project_id,
    objective: row.objective,
    trigger: row.trigger_text,
    implementationSteps: JSON.parse(row.implementation_steps) as string[],
    assumptions: row.assumptions,
    verificationChecks: JSON.parse(row.verification_checks) as string[],
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

export function getProjectPlan(workspaceId: string, projectId: string) {
  const row = database()
    .prepare("SELECT * FROM project_plans WHERE workspace_id = ? AND project_id = ?")
    .get(workspaceId, projectId) as unknown as ProjectPlanRow | undefined;
  return row ? toProjectPlan(row) : null;
}

function fingerprintProjectRequirements(workspaceId: string, projectId: string) {
  return createHash("sha256").update(JSON.stringify(getProjectRequirements(workspaceId, projectId))).digest("hex");
}

function saveProjectPlanRequirementContext(workspaceId: string, projectId: string, db = database()) {
  db.prepare(
    `INSERT INTO project_plan_requirement_context (project_id, workspace_id, requirements_fingerprint, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET workspace_id=excluded.workspace_id, requirements_fingerprint=excluded.requirements_fingerprint, updated_at=excluded.updated_at`
  ).run(projectId, workspaceId, fingerprintProjectRequirements(workspaceId, projectId), new Date().toISOString());
}

export function getProjectPlanFreshness(workspaceId: string, projectId: string): ProjectPlanFreshness {
  if (!getProjectPlan(workspaceId, projectId)) return "draft";
  const row = database().prepare(
    "SELECT requirements_fingerprint FROM project_plan_requirement_context WHERE workspace_id = ? AND project_id = ?"
  ).get(workspaceId, projectId) as { requirements_fingerprint: string } | undefined;
  if (!row) return "unknown";
  return row.requirements_fingerprint === fingerprintProjectRequirements(workspaceId, projectId) ? "current" : "requirements_changed";
}

export function getProjectWorkflowSourceFingerprint(workspaceId: string, projectId: string) {
  const project = getProject(workspaceId, projectId);
  if (!project) return null;
  return createHash("sha256").update(JSON.stringify({
    generatorVersion: 1,
    name: project.name,
    goal: project.goal,
    platform: project.platform,
    requirements: project.requirements,
    plan: getProjectPlan(workspaceId, projectId),
  })).digest("hex");
}

export function createProjectPlan(workspaceId: string, projectId: string, input: ProjectPlanInput) {
  const now = new Date().toISOString();
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = getProjectPlan(workspaceId, projectId);
    if (existing) {
      db.exec("COMMIT");
      return existing;
    }
    db.prepare(
      `INSERT INTO project_plans (project_id, workspace_id, objective, trigger_text, implementation_steps, assumptions, verification_checks, revision, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(projectId, workspaceId, input.objective, input.trigger, JSON.stringify(input.implementationSteps), input.assumptions, JSON.stringify(input.verificationChecks), now);
    db.prepare(
      "INSERT INTO project_plan_versions (project_id, workspace_id, revision, objective, trigger_text, implementation_steps, assumptions, verification_checks, created_at) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)"
    ).run(projectId, workspaceId, input.objective, input.trigger, JSON.stringify(input.implementationSteps), input.assumptions, JSON.stringify(input.verificationChecks), now);
    saveProjectPlanRequirementContext(workspaceId, projectId, db);
    const plan = getProjectPlan(workspaceId, projectId);
    if (!plan) throw new Error("Created plan could not be loaded.");
    db.exec("COMMIT");
    return plan;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function updateProjectPlan(workspaceId: string, projectId: string, input: ProjectPlanInput) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = db.prepare(
    `UPDATE project_plans SET objective = ?, trigger_text = ?, implementation_steps = ?, assumptions = ?, verification_checks = ?, revision = revision + 1, updated_at = ?
     WHERE workspace_id = ? AND project_id = ?`
    ).run(input.objective, input.trigger, JSON.stringify(input.implementationSteps), input.assumptions, JSON.stringify(input.verificationChecks), new Date().toISOString(), workspaceId, projectId) as { changes: number | bigint };
    if (!Number(result.changes)) {
      db.exec("ROLLBACK");
      return null;
    }
    const current = getProjectPlan(workspaceId, projectId);
    if (!current) throw new Error("Updated plan could not be loaded.");
    db.prepare(
      "INSERT INTO project_plan_versions (project_id, workspace_id, revision, objective, trigger_text, implementation_steps, assumptions, verification_checks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(projectId, workspaceId, current.revision, current.objective, current.trigger, JSON.stringify(current.implementationSteps), current.assumptions, JSON.stringify(current.verificationChecks), current.updatedAt);
    saveProjectPlanRequirementContext(workspaceId, projectId, db);
    db.exec("COMMIT");
    return current;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listProjectPlanVersions(workspaceId: string, projectId: string) {
  const current = getProjectPlan(workspaceId, projectId);
  const rows = database().prepare(
    "SELECT project_id, workspace_id, revision, objective, trigger_text, implementation_steps, assumptions, verification_checks, created_at AS updated_at FROM project_plan_versions WHERE workspace_id = ? AND project_id = ? ORDER BY revision DESC LIMIT 50"
  ).all(workspaceId, projectId) as unknown as ProjectPlanRow[];
  const versions = rows.map(toProjectPlan);
  if (current && !versions.some((version) => version.revision === current.revision)) versions.unshift(current);
  return versions.sort((a, b) => b.revision - a.revision).slice(0, 50);
}

export function getProjectPlanVersion(workspaceId: string, projectId: string, revision: number) {
  const row = database().prepare(
    "SELECT project_id, workspace_id, revision, objective, trigger_text, implementation_steps, assumptions, verification_checks, created_at AS updated_at FROM project_plan_versions WHERE workspace_id = ? AND project_id = ? AND revision = ?"
  ).get(workspaceId, projectId, revision) as unknown as ProjectPlanRow | undefined;
  return row ? toProjectPlan(row) : null;
}

const emptyProjectSetup: ProjectSetup = {
  workflow_imported: false,
  fields_configured: false,
  credentials_connected: false,
  schedule_checked: false,
  test_reviewed: false,
};

export function getProjectSetup(workspaceId: string, projectId: string): ProjectSetup {
  const db = database();
  const row = db
    .prepare("SELECT checks_json FROM project_setup WHERE workspace_id = ? AND project_id = ?")
    .get(workspaceId, projectId) as { checks_json: string } | undefined;
  if (!row) return emptyProjectSetup;
  const context = db.prepare("SELECT artifact_id FROM project_setup_artifact_context WHERE workspace_id = ? AND project_id = ?")
    .get(workspaceId, projectId) as { artifact_id: string | null } | undefined;
  const latestArtifact = db.prepare("SELECT id FROM project_workflow_artifacts WHERE workspace_id = ? AND project_id = ? ORDER BY version DESC LIMIT 1")
    .get(workspaceId, projectId) as { id: string } | undefined;
  if (latestArtifact && context?.artifact_id !== latestArtifact.id) return emptyProjectSetup;
  if (!latestArtifact && context?.artifact_id) return emptyProjectSetup;
  return { ...emptyProjectSetup, ...(JSON.parse(row.checks_json) as Partial<ProjectSetup>) };
}

export function saveProjectSetup(workspaceId: string, projectId: string, checks: ProjectSetup) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const latestArtifact = db.prepare("SELECT id FROM project_workflow_artifacts WHERE workspace_id = ? AND project_id = ? ORDER BY version DESC LIMIT 1")
      .get(workspaceId, projectId) as { id: string } | undefined;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO project_setup (project_id, workspace_id, checks_json, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(project_id) DO UPDATE SET checks_json = excluded.checks_json, updated_at = excluded.updated_at
       WHERE project_setup.workspace_id = excluded.workspace_id`
    ).run(projectId, workspaceId, JSON.stringify(checks), now);
    db.prepare(
      `INSERT INTO project_setup_artifact_context (project_id, workspace_id, artifact_id, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(project_id) DO UPDATE SET workspace_id=excluded.workspace_id, artifact_id=excluded.artifact_id, updated_at=excluded.updated_at`
    ).run(projectId, workspaceId, latestArtifact?.id ?? null, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getProjectSetup(workspaceId, projectId);
}

export type ProjectWebhookSecretStatus = {
  configured: boolean;
  headerName: string;
  credentialName: string;
  generatedAt: string | null;
};

export function getProjectWebhookSecretStatus(workspaceId: string, projectId: string): ProjectWebhookSecretStatus {
  const row = database().prepare(
    "SELECT header_name, credential_name, generated_at FROM project_webhook_secrets WHERE workspace_id = ? AND project_id = ?"
  ).get(workspaceId, projectId) as { header_name: string; credential_name: string; generated_at: string } | undefined;
  return row
    ? { configured: true, headerName: row.header_name, credentialName: row.credential_name, generatedAt: row.generated_at }
    : { configured: false, headerName: "", credentialName: "", generatedAt: null };
}

export function rotateProjectWebhookSecret(workspaceId: string, projectId: string, secretHash: string) {
  const db = database();
  const now = new Date().toISOString();
  const headerName = `X-Autqora-${projectId.replaceAll("-", "").slice(0, 12)}-Hook`;
  const credentialName = `AUTQORA Webhook Auth ${projectId.slice(0, 8)}`;
  db.prepare(
    `INSERT INTO project_webhook_secrets (project_id, workspace_id, secret_hash, header_name, credential_name, generated_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET secret_hash=excluded.secret_hash, header_name=excluded.header_name, credential_name=excluded.credential_name, generated_at=excluded.generated_at, updated_at=excluded.updated_at
     WHERE project_webhook_secrets.workspace_id=excluded.workspace_id`
  ).run(projectId, workspaceId, secretHash, headerName, credentialName, now, now);
  return { headerName, credentialName, generatedAt: now };
}

type WorkflowArtifactRow = {
  id: string;
  project_id: string;
  workspace_id: string;
  version: number;
  name: string;
  scenario: string;
  created_at: string;
  source_fingerprint?: string | null;
};

function toWorkflowArtifact(row: WorkflowArtifactRow, currentFingerprint: string | null): WorkflowArtifact {
  const sourceStatus = !row.source_fingerprint || !currentFingerprint ? "unknown" : row.source_fingerprint === currentFingerprint ? "current" : "stale";
  return { id: row.id, projectId: row.project_id, version: row.version, name: row.name, scenario: row.scenario, sourceStatus, createdAt: row.created_at };
}

export function listWorkflowArtifacts(workspaceId: string, projectId: string) {
  const currentFingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
  const rows = database().prepare(
    "SELECT a.id, a.project_id, a.workspace_id, a.version, a.name, a.scenario, a.created_at, c.source_fingerprint FROM project_workflow_artifacts a LEFT JOIN project_workflow_source_context c ON c.artifact_id = a.id AND c.workspace_id = a.workspace_id WHERE a.workspace_id = ? AND a.project_id = ? ORDER BY a.version DESC LIMIT 20"
  ).all(workspaceId, projectId) as unknown as WorkflowArtifactRow[];
  return rows.map((row) => toWorkflowArtifact(row, currentFingerprint));
}

export function saveWorkflowArtifact(workspaceId: string, projectId: string, name: string, scenario: string, workflow: unknown, sourceFingerprint?: string) {
  const db = database();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT COALESCE(MAX(version), 0) + 1 AS version FROM project_workflow_artifacts WHERE workspace_id = ? AND project_id = ?")
      .get(workspaceId, projectId) as { version: number };
    db.prepare(
      "INSERT INTO project_workflow_artifacts (id, project_id, workspace_id, version, name, scenario, workflow_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, projectId, workspaceId, row.version, name, scenario, JSON.stringify(workflow), now);
    if (sourceFingerprint) {
      db.prepare("INSERT INTO project_workflow_source_context (artifact_id, workspace_id, source_fingerprint, created_at) VALUES (?, ?, ?, ?)")
        .run(id, workspaceId, sourceFingerprint, now);
    }
    db.exec("COMMIT");
    return { id, version: row.version, createdAt: now };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getWorkflowArtifact(workspaceId: string, projectId: string, artifactId: string) {
  const row = database().prepare(
    "SELECT workflow_json FROM project_workflow_artifacts WHERE workspace_id = ? AND project_id = ? AND id = ?"
  ).get(workspaceId, projectId, artifactId) as { workflow_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.workflow_json) as Record<string, unknown>;
}

export function getLatestWorkflowArtifact(workspaceId: string, projectId: string) {
  const currentFingerprint = getProjectWorkflowSourceFingerprint(workspaceId, projectId);
  const row = database().prepare(
    "SELECT a.id, a.project_id, a.workspace_id, a.version, a.name, a.scenario, a.workflow_json, a.created_at, c.source_fingerprint FROM project_workflow_artifacts a LEFT JOIN project_workflow_source_context c ON c.artifact_id = a.id AND c.workspace_id = a.workspace_id WHERE a.workspace_id = ? AND a.project_id = ? ORDER BY a.version DESC LIMIT 1"
  ).get(workspaceId, projectId) as (WorkflowArtifactRow & { workflow_json: string }) | undefined;
  if (!row) return null;
  return { artifact: toWorkflowArtifact(row, currentFingerprint), workflow: JSON.parse(row.workflow_json) as Record<string, unknown> };
}

export function saveWorkflowVerification(workspaceId: string, projectId: string, artifactId: string, artifactVersion: number, status: WorkflowVerification["status"], checks: WorkflowVerification["checks"]) {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  database().prepare(
    "INSERT INTO project_workflow_verifications (id, project_id, artifact_id, workspace_id, artifact_version, status, checks_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, projectId, artifactId, workspaceId, artifactVersion, status, JSON.stringify(checks), createdAt);
  return { id, projectId, artifactId, artifactVersion, status, checks, createdAt } satisfies WorkflowVerification;
}

export function listWorkflowVerifications(workspaceId: string, projectId: string) {
  const rows = database().prepare(
    "SELECT id, project_id, artifact_id, artifact_version, status, checks_json, created_at FROM project_workflow_verifications WHERE workspace_id = ? AND project_id = ? ORDER BY created_at DESC LIMIT 10"
  ).all(workspaceId, projectId) as unknown as Array<{ id: string; project_id: string; artifact_id: string; artifact_version: number; status: WorkflowVerification["status"]; checks_json: string; created_at: string }>;
  return rows.map((row) => ({ id: row.id, projectId: row.project_id, artifactId: row.artifact_id, artifactVersion: row.artifact_version, status: row.status, checks: JSON.parse(row.checks_json) as WorkflowVerification["checks"], createdAt: row.created_at }));
}

type ManualWorkflowEvidenceRow = {
  id: string;
  project_id: string;
  artifact_id: string;
  artifact_version: number;
  result: ManualWorkflowTestEvidence["result"];
  environment: ManualWorkflowTestEvidence["environment"];
  summary: string;
  execution_reference: string;
  reported_at: string;
};

export function listManualWorkflowEvidence(workspaceId: string, projectId: string) {
  const rows = database().prepare(
    "SELECT id, project_id, artifact_id, artifact_version, result, environment, summary, execution_reference, reported_at FROM project_manual_workflow_evidence WHERE workspace_id = ? AND project_id = ? ORDER BY reported_at DESC LIMIT 20"
  ).all(workspaceId, projectId) as unknown as ManualWorkflowEvidenceRow[];
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    artifactId: row.artifact_id,
    artifactVersion: row.artifact_version,
    result: row.result,
    environment: row.environment,
    summary: row.summary,
    executionReference: row.execution_reference,
    reportedAt: row.reported_at,
  } satisfies ManualWorkflowTestEvidence));
}

export function saveManualWorkflowEvidence(workspaceId: string, projectId: string, artifactId: string, artifactVersion: number, input: ManualWorkflowTestEvidenceInput) {
  const id = randomUUID();
  const reportedAt = new Date().toISOString();
  database().prepare(
    "INSERT INTO project_manual_workflow_evidence (id, project_id, artifact_id, workspace_id, artifact_version, result, environment, summary, execution_reference, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, projectId, artifactId, workspaceId, artifactVersion, input.result, input.environment, input.summary, input.executionReference, reportedAt);
  return listManualWorkflowEvidence(workspaceId, projectId).find((item) => item.id === id) ?? null;
}

export function listN8nExecutionEvidence(workspaceId: string, projectId: string): N8nExecutionEvidence[] {
  const rows = database().prepare(
    "SELECT id, project_id, artifact_id, artifact_version, execution_id, reported_status, node_names_json, last_node_executed, failed_nodes_json, reported_at FROM project_n8n_execution_evidence WHERE workspace_id = ? AND project_id = ? ORDER BY reported_at DESC LIMIT 20"
  ).all(workspaceId, projectId) as unknown as Array<{ id: string; project_id: string; artifact_id: string; artifact_version: number; execution_id: string; reported_status: N8nExecutionEvidence["reportedStatus"]; node_names_json: string; last_node_executed: string | null; failed_nodes_json: string; reported_at: string }>;
  return rows.map((row) => ({ id: row.id, projectId: row.project_id, artifactId: row.artifact_id, artifactVersion: row.artifact_version, executionId: row.execution_id, reportedStatus: row.reported_status, nodeNames: JSON.parse(row.node_names_json) as string[], lastNodeExecuted: row.last_node_executed, failedNodes: JSON.parse(row.failed_nodes_json) as string[], reportedAt: row.reported_at }));
}

export function saveN8nExecutionEvidence(workspaceId: string, projectId: string, artifactId: string, artifactVersion: number, input: Omit<N8nExecutionEvidence, "id" | "projectId" | "artifactId" | "artifactVersion" | "reportedAt">) {
  const db = database();
  const id = randomUUID();
  const reportedAt = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "INSERT INTO project_n8n_execution_evidence (id, project_id, artifact_id, workspace_id, artifact_version, execution_id, reported_status, node_names_json, last_node_executed, failed_nodes_json, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, projectId, artifactId, workspaceId, artifactVersion, input.executionId, input.reportedStatus, JSON.stringify(input.nodeNames), input.lastNodeExecuted, JSON.stringify(input.failedNodes), reportedAt);
    db.prepare(
      `DELETE FROM project_n8n_execution_evidence WHERE workspace_id = ? AND project_id = ? AND id NOT IN
       (SELECT id FROM project_n8n_execution_evidence WHERE workspace_id = ? AND project_id = ? ORDER BY reported_at DESC LIMIT 50)`
    ).run(workspaceId, projectId, workspaceId, projectId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return listN8nExecutionEvidence(workspaceId, projectId).find((item) => item.id === id) ?? null;
}

type ProjectDebugReportRow = {
  id: string;
  project_id: string;
  platform: DebugPlatform;
  error_text: string;
  expected: string;
  diagnosis_json: string;
  created_at: string;
};

function toProjectDebugReport(row: ProjectDebugReportRow): ProjectDebugReport {
  return {
    id: row.id,
    projectId: row.project_id,
    platform: row.platform,
    error: row.error_text,
    expected: row.expected,
    diagnosis: JSON.parse(row.diagnosis_json) as DebugDiagnosis,
    createdAt: row.created_at,
  };
}

export function listProjectDebugReports(workspaceId: string, projectId: string) {
  const rows = database().prepare(
    "SELECT id, project_id, platform, error_text, expected, diagnosis_json, created_at FROM project_debug_reports WHERE workspace_id = ? AND project_id = ? ORDER BY created_at DESC LIMIT 20"
  ).all(workspaceId, projectId) as unknown as ProjectDebugReportRow[];
  return rows.map(toProjectDebugReport);
}

export function saveProjectDebugReport(workspaceId: string, projectId: string, platform: DebugPlatform, error: string, expected: string, diagnosis: DebugDiagnosis) {
  const db = database();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO project_debug_reports (id, project_id, workspace_id, platform, error_text, expected, diagnosis_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, projectId, workspaceId, platform, error, expected, JSON.stringify(diagnosis), now);
  db.prepare(
    `DELETE FROM project_debug_reports WHERE workspace_id = ? AND project_id = ? AND id NOT IN
     (SELECT id FROM project_debug_reports WHERE workspace_id = ? AND project_id = ? ORDER BY created_at DESC LIMIT 50)`
  ).run(workspaceId, projectId, workspaceId, projectId);
  return listProjectDebugReports(workspaceId, projectId).find((report) => report.id === id) ?? null;
}

type UserRow = { id: string; email: string; password_salt: string; password_hash: string; workspace_id: string };

export type AuthenticatedAccount = { id: string; email: string; workspaceId: string };

export function findUserByEmail(email: string) {
  return database().prepare("SELECT id, email, password_salt, password_hash, workspace_id FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
}

export function createUser(email: string, passwordSalt: string, passwordHash: string, workspaceId: string) {
  const id = randomUUID();
  database().prepare("INSERT INTO users (id, email, password_salt, password_hash, workspace_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, email.trim().toLowerCase(), passwordSalt, passwordHash, workspaceId, new Date().toISOString());
  return { id, email: email.trim().toLowerCase(), workspaceId } satisfies AuthenticatedAccount;
}

export function changeUserPassword(userId: string, passwordSalt: string, passwordHash: string) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = db.prepare("UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?")
      .run(passwordSalt, passwordHash, userId) as { changes: number | bigint };
    if (!result.changes) throw new Error("Account not found.");
    db.prepare("DELETE FROM user_sessions WHERE user_id = ?").run(userId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createUserSession(userId: string) {
  const db = database();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM user_sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO user_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(tokenHash, userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}

function sessionToken(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("aq_session="));
  const token = cookie?.slice("aq_session=".length);
  return token && /^[A-Za-z0-9_-]{40,50}$/.test(token) ? token : null;
}

export function getAuthenticatedAccount(request: Request): AuthenticatedAccount | null {
  const token = sessionToken(request);
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = database().prepare(
    "SELECT users.id, users.email, users.workspace_id FROM user_sessions JOIN users ON users.id = user_sessions.user_id WHERE user_sessions.token_hash = ? AND user_sessions.expires_at > ?"
  ).get(tokenHash, Date.now()) as { id: string; email: string; workspace_id: string } | undefined;
  return row ? { id: row.id, email: row.email, workspaceId: row.workspace_id } : null;
}

export function revokeUserSession(request: Request) {
  const token = sessionToken(request);
  if (!token) return;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  database().prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(tokenHash);
}

export function consumeAuthRateLimit(key: string, limit: number, windowMs: number) {
  const db = database();
  const keyHash = createHash("sha256").update(key).digest("hex");
  const now = Date.now();
  const row = db.prepare("SELECT window_started_at, attempts FROM auth_rate_limits WHERE key_hash = ?").get(keyHash) as { window_started_at: number; attempts: number } | undefined;
  if (!row || now - row.window_started_at >= windowMs) {
    db.prepare("INSERT INTO auth_rate_limits (key_hash, window_started_at, attempts) VALUES (?, ?, 1) ON CONFLICT(key_hash) DO UPDATE SET window_started_at = excluded.window_started_at, attempts = 1").run(keyHash, now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (row.attempts >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - row.window_started_at)) / 1000)) };
  db.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE key_hash = ?").run(keyHash);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearAuthRateLimit(key: string) {
  const keyHash = createHash("sha256").update(key).digest("hex");
  database().prepare("DELETE FROM auth_rate_limits WHERE key_hash = ?").run(keyHash);
}

export function authSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `aq_session=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${secure}`;
}

export function clearAuthSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `aq_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

const workspaceCookieName = "aq_workspace";

export function getWorkspaceId(request: Request) {
  const account = getAuthenticatedAccount(request);
  if (account) return account.workspaceId;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${workspaceCookieName}=`));
  const value = cookie?.slice(workspaceCookieName.length + 1);
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export function createWorkspaceId() {
  return randomUUID();
}

export function workspaceCookie(workspaceId: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${workspaceCookieName}=${workspaceId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`;
}
