import type { Project } from "@/lib/project-domain";

export type ProjectScenario = {
  isInstagramPost: boolean;
  isWebhookIntake: boolean;
  isWebhookForward: boolean;
  isGoogleSheetsLeadEmail: boolean;
  isYoutubeVideoClips: boolean;
  isYoutubeLiveStream: boolean;
  isClipPublishingPipeline: boolean;
  workflowKind: "instagram_photo_post" | "webhook_api_forward" | "webhook_intake" | "google_sheets_lead_email" | "youtube_video_clips" | "youtube_clip_publishing_pipeline" | "generic_scaffold";
};

/** Classifies the same saved brief consistently across planning, export, and setup guidance. */
export function getProjectScenario(project: Project): ProjectScenario {
  const requirements = project.requirements;
  const briefText = [project.name, project.goal, requirements.trigger, requirements.sourceApp, requirements.destinationApp].join(" ");
  const isInstagramPost = /instagram|\binsta\b/i.test(briefText);
  const isGoogleSheetsLeadEmail = !isInstagramPost && /google\s*sheets/i.test(briefText) && /gmail|email|notification/i.test(briefText) && /lead|row/i.test(briefText);
  const isYoutubeVideoClips = /youtube|\byoutube\b/i.test(briefText) && /clip|short/i.test(briefText);
  const isYoutubeLiveStream = isYoutubeVideoClips && /live\s*stream|livestream|live broadcast|streaming/i.test(briefText);
  const requestsClipPublishing = isYoutubeVideoClips
    && /\b(?:auto(?:matically)?\s*(?:post|publish|upload)|publish|post|upload)\b/i.test(briefText)
    && /instagram|\binsta\b/i.test(briefText);
  const isClipPublishingPipeline = isYoutubeLiveStream && requestsClipPublishing;
  const isWebhookIntake = !isInstagramPost && /webhook|api endpoint|http\s+(?:post|request)|receive\s+(?:an?\s+)?(?:http\s+)?(?:post\s+)?request/i.test(briefText);
  const destination = requirements.destinationApp.trim();
  const isWebhookForward = isWebhookIntake && Boolean(destination) && !/^(unknown|not sure|none|n\/a)$/i.test(destination);
  return {
    isInstagramPost,
    isWebhookIntake,
    isWebhookForward,
    isGoogleSheetsLeadEmail,
    isYoutubeVideoClips,
    isYoutubeLiveStream,
    isClipPublishingPipeline,
    workflowKind: isClipPublishingPipeline ? "youtube_clip_publishing_pipeline" : isYoutubeVideoClips ? "youtube_video_clips" : isInstagramPost ? "instagram_photo_post" : isGoogleSheetsLeadEmail ? "google_sheets_lead_email" : isWebhookForward ? "webhook_api_forward" : isWebhookIntake ? "webhook_intake" : "generic_scaffold",
  };
}
