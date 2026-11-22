import type { Project, ProjectPlanInput } from "@/lib/project-domain";
import { projectPlanSchema } from "@/lib/project-domain";
import { redactSecrets } from "@/lib/debug-diagnostics";

export class AiPlanningError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiPlanningError";
    this.status = status;
  }
}

const planJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["objective", "trigger", "implementationSteps", "assumptions", "verificationChecks"],
  properties: {
    objective: { type: "string" },
    trigger: { type: "string" },
    implementationSteps: { type: "array", items: { type: "string" } },
    assumptions: { type: "string" },
    verificationChecks: { type: "array", items: { type: "string" } },
  },
} as const;

function extractOutputText(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const output = (body as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  return output.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const record = part as { type?: unknown; text?: unknown };
      return record.type === "output_text" && typeof record.text === "string" ? [record.text] : [];
    });
  }).join("\n");
}

export async function draftPlanWithAi(project: Project): Promise<ProjectPlanInput> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiPlanningError("AI planning is not configured yet. Add OPENAI_API_KEY to the server environment when you are ready.", 503);
  const model = process.env.AUTQORA_OPENAI_MODEL?.trim() || "gpt-6-luna";
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1_600,
        instructions: [
          "You are AUTQORA's automation architect. Produce a practical implementation plan from the project brief.",
          "Use only details in the supplied project. Identify unknowns in assumptions; do not invent endpoints, credentials, permissions, integrations, or successful tests.",
          "Prefer a small, low-cost implementation. Keep generated steps specific, ordered, and understandable to a beginner.",
          "Never repeat any credential-like strings from the brief. Do not include secrets or personal data in the plan.",
          "Return 3 to 10 implementation steps and 3 to 8 verification checks. Mention human review before any real side effect or production activation.",
        ].join(" "),
        input: JSON.stringify({
          project: { name: redactSecrets(project.name), goal: redactSecrets(project.goal), platform: project.platform, status: project.status },
          requirements: {
            ...project.requirements,
            trigger: redactSecrets(project.requirements.trigger),
            sourceApp: redactSecrets(project.requirements.sourceApp),
            destinationApp: redactSecrets(project.requirements.destinationApp),
            destinationEndpoint: project.requirements.destinationEndpoint ? "Configured in AUTQORA; URL withheld from AI." : "",
            monthlyVolume: redactSecrets(project.requirements.monthlyVolume),
            constraints: redactSecrets(project.requirements.constraints),
            fieldMappings: project.requirements.fieldMappings.map((mapping) => ({
              ...mapping,
              sourcePath: redactSecrets(mapping.sourcePath),
              targetPath: redactSecrets(mapping.targetPath),
            })),
          },
        }),
        text: { format: { type: "json_schema", name: "autqora_implementation_plan", strict: true, schema: planJsonSchema } },
      }),
    });
  } catch {
    throw new AiPlanningError("Could not reach the AI planning service. Check the server connection and try again.", 502);
  }
  if (!response.ok) {
    if (response.status === 429) throw new AiPlanningError("The AI provider rate limit was reached. Try again later.", 429);
    if (response.status === 401 || response.status === 403) throw new AiPlanningError("The AI provider rejected its configured API key. Check OPENAI_API_KEY on the server.", 503);
    throw new AiPlanningError("The AI provider could not draft a plan right now. Try again later.", 502);
  }
  let body: unknown;
  try { body = await response.json(); } catch { throw new AiPlanningError("The AI provider returned an unreadable response."); }
  const text = extractOutputText(body);
  if (!text) throw new AiPlanningError("The AI provider did not return a plan. Review the brief and try again.");
  let candidate: unknown;
  try { candidate = JSON.parse(text); } catch { throw new AiPlanningError("The AI provider returned a plan in an unsupported format."); }
  const parsed = projectPlanSchema.safeParse(candidate);
  if (!parsed.success) throw new AiPlanningError("The AI provider returned a plan that failed AUTQORA's validation. Try again.");
  return parsed.data;
}
