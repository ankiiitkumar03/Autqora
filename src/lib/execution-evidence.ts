import { redactSecrets } from "@/lib/debug-diagnostics";

export const n8nExecutionStatuses = ["success", "error", "waiting", "canceled", "crashed", "running", "new"] as const;
export type N8nExecutionStatus = (typeof n8nExecutionStatuses)[number] | "unknown";

export type N8nExecutionReview = {
  executionId: string;
  reportedStatus: N8nExecutionStatus;
  nodeNames: string[];
  lastNodeExecuted: string | null;
  failedNodes: string[];
};

function safeNodeName(value: unknown) {
  return typeof value === "string" ? redactSecrets(value).replace(/[\r\n\t]/g, " ").trim().slice(0, 100) : "";
}

/** Reads a bounded subset of n8n execution JSON and discards node input/output values. */
export function reviewN8nExecution(value: unknown): N8nExecutionReview | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const outer = value as Record<string, unknown>;
  const execution = outer.execution && typeof outer.execution === "object" && !Array.isArray(outer.execution)
    ? outer.execution as Record<string, unknown>
    : outer;
  const data = execution.data && typeof execution.data === "object" && !Array.isArray(execution.data)
    ? execution.data as Record<string, unknown>
    : execution;
  const resultData = data.resultData && typeof data.resultData === "object" && !Array.isArray(data.resultData)
    ? data.resultData as Record<string, unknown>
    : null;
  const runData = resultData?.runData && typeof resultData.runData === "object" && !Array.isArray(resultData.runData)
    ? resultData.runData as Record<string, unknown>
    : null;
  const statusValue = typeof execution.status === "string" ? execution.status.toLowerCase() : "";
  const reportedStatus = (n8nExecutionStatuses as readonly string[]).includes(statusValue) ? statusValue as N8nExecutionStatus : "unknown";
  if (!runData && reportedStatus === "unknown") return null;
  const nodeNames = Object.keys(runData ?? {}).slice(0, 250).map(safeNodeName).filter(Boolean);
  const failedNodes = Object.entries(runData ?? {}).slice(0, 250).flatMap(([name, runs]) => {
    if (!Array.isArray(runs)) return [];
    return runs.some((run) => Boolean(run && typeof run === "object" && !Array.isArray(run) && (run as Record<string, unknown>).error))
      ? [safeNodeName(name)] : [];
  }).filter(Boolean);
  const lastNode = safeNodeName(resultData?.lastNodeExecuted);
  const id = typeof execution.id === "string" || typeof execution.id === "number" ? String(execution.id) : "";
  return {
    executionId: redactSecrets(id).replace(/[\r\n\t]/g, " ").slice(0, 100),
    reportedStatus,
    nodeNames,
    lastNodeExecuted: lastNode || null,
    failedNodes,
  };
}
