import type { Project, ProjectPlatform } from "@/lib/project-domain";
import { getProjectScenario } from "@/lib/project-scenario";

export type ToolRecommendation = {
  platform: Exclude<ProjectPlatform, "Other">;
  fit: "Best fit" | "Alternative";
  coverage: "starter_export" | "partial_export" | "scaffold_only" | "setup_guidance";
  reasons: string[];
  tradeoffs: string[];
  costNote: string;
};

/** Explainable MVP rules. This is a maintained heuristic catalog, not live pricing or AI. */
export function recommendTools(project: Project): ToolRecommendation[] {
  const text = `${project.name} ${project.goal}`.toLowerCase();
  const usesSocial = /instagram|\binsta\b|social media|post(ing)?/.test(text);
  const scenario = getProjectScenario(project);
  const hasImplementedScenario = scenario.isInstagramPost || scenario.isWebhookIntake || scenario.isGoogleSheetsLeadEmail || scenario.isYoutubeVideoClips;
  const n8nCoverage = scenario.isClipPublishingPipeline
    ? "partial_export" as const
    : hasImplementedScenario ? "starter_export" as const : "scaffold_only" as const;
  const needsCustomCode = /custom code|complex logic|large volume|self.host|on premises|on-premises|data pipeline/.test(text)
    || project.requirements.technicalComfort === "advanced"
    || /self.host/i.test(project.requirements.constraints);
  const wantsSimpleSetup = /no.?code|beginner|simple|easy setup|without code/.test(text)
    || project.requirements.technicalComfort === "beginner";
  const budgetReasons = project.requirements.budget === "free"
    ? " Budget preference is free-only, so verify self-hosting and free-tier limits before choosing."
    : project.requirements.budget === "under_25"
      ? " The stated budget is under $25/month; confirm hosting and task limits fit before building."
      : "";
  const requirementsReason = project.requirements.sourceApp || project.requirements.destinationApp
    ? ` Stated app path: ${project.requirements.sourceApp || "unspecified"} → ${project.requirements.destinationApp || "unspecified"}.`
    : "";

  if (project.platform === "n8n" || usesSocial) {
    return [
      {
        platform: "n8n",
        fit: "Best fit",
        coverage: n8nCoverage,
        reasons: [scenario.isClipPublishingPipeline
          ? `The brief combines live YouTube clipping with Instagram and YouTube publishing. AUTQORA exports archived-video clipping with opt-in YouTube and Instagram Reels branches plus same-run individual clip approval; live capture and semantic moment selection remain missing.${requirementsReason}${budgetReasons}`
          : `${usesSocial ? "The brief mentions social posting, and n8n can call the Meta Graph API through HTTP Request nodes." : "This is the platform selected in the project brief."}${requirementsReason}${budgetReasons}`, "Exportable workflow JSON supports user-controlled import into a self-hosted or hosted n8n instance."],
        tradeoffs: ["You configure and maintain n8n, credentials, hosting, and schedule availability.", scenario.isClipPublishingPipeline ? "The clipper export is still partial; neither publisher branch has been runtime-tested, and it does not capture live streams." : "A generated export still needs a real import and provider-side test."],
        costNote: "AUTQORA has not checked live n8n plan prices. Hosting and service usage may cost money; check current provider pricing.",
      },
      {
        platform: "Make",
        fit: "Alternative",
        coverage: "setup_guidance",
        reasons: ["Visual scenario builder can suit teams that prefer a hosted interface.", "Consider it if the required app actions are available as Make modules."],
        tradeoffs: ["This AUTQORA project cannot export a Make scenario yet.", "Operations and plan limits depend on current Make pricing."],
        costNote: "Check current Make plan, operation, and app access limits before choosing.",
      },
    ];
  }

  if (needsCustomCode || project.platform === "Python") {
    return [
      {
        platform: "Python",
        fit: "Best fit",
        coverage: "setup_guidance",
        reasons: ["The brief signals custom logic, higher volume, or an existing Python preference.", "Code gives control over validation, retries, and deployment choices."],
        tradeoffs: ["You need a runtime, deployment, monitoring, and credential storage.", "AUTQORA does not yet generate or run a Python implementation."],
        costNote: "Runtime and third-party API costs depend on the hosting and services you select.",
      },
      {
        platform: "n8n",
        fit: "Alternative",
        coverage: "scaffold_only",
        reasons: ["A visual workflow can make step-by-step debugging easier.", "Use it if the logic maps cleanly to available nodes and API calls."],
        tradeoffs: ["Complex branching may still require custom code nodes.", "This project export is not yet tailored to the described Python scenario."],
        costNote: "Check n8n hosting costs and any connected service pricing.",
      },
    ];
  }

  if (wantsSimpleSetup || project.platform === "Zapier" || project.platform === "Make") {
    const preferred = project.platform === "Make" ? "Make" : "Zapier";
    const alternative = preferred === "Make" ? "Zapier" : "Make";
    return [
      {
        platform: preferred,
        fit: "Best fit",
        coverage: "setup_guidance",
        reasons: [`${project.platform === preferred ? "This matches the platform selected in the project brief." : "A hosted visual builder may reduce server setup for a straightforward app-to-app flow."}${requirementsReason}${budgetReasons}`, "Start by confirming both apps and required actions are supported."],
        tradeoffs: ["Task/operation limits and paid tiers can affect recurring workflows.", "AUTQORA cannot export this scenario to the selected platform yet."],
        costNote: `Check current ${preferred} pricing and task limits before committing.`,
      },
      {
        platform: alternative,
        fit: "Alternative",
        coverage: "setup_guidance",
        reasons: ["Compare app coverage, ease of editing, and operational limits for the same scenario."],
        tradeoffs: ["Switching platforms may require rebuilding the workflow.", "Confirm supported triggers and actions before setup."],
        costNote: `Check current ${alternative} pricing and task limits before committing.`,
      },
    ];
  }

  return [
    {
      platform: "n8n",
      fit: "Best fit",
      coverage: "scaffold_only",
      reasons: [project.platform === "Other" ? "The selected platform is not in the supported recommendation catalog; n8n is the current AUTQORA export target." : "No strong platform constraint was identified, and n8n is AUTQORA's current export target."],
      tradeoffs: ["Requires n8n setup and credential configuration.", "AUTQORA has starter exports for Instagram photo posts, authenticated webhook intake/forwarding, Google Sheets lead emails, and YouTube video clipping; other requests still receive a scaffold."],
      costNote: "Check current hosting and connected-service prices; no live price lookup is available here.",
    },
    {
      platform: "Make",
      fit: "Alternative",
      coverage: "setup_guidance",
      reasons: ["A hosted visual builder may reduce server maintenance for supported app integrations."],
      tradeoffs: ["This project cannot currently generate or export a Make scenario."],
      costNote: "Check current plan limits, pricing, and app support.",
    },
  ];
}
