import type { ProjectRequirements } from "@/lib/project-domain";

export type WebhookMappingPreview = {
  mappedPayload: Record<string, unknown>;
  missingOptionalPaths: string[];
  missingRequiredPaths: string[];
};

/** Applies the saved generic field mappings to a JSON object without persisting input or output. */
export function previewWebhookMapping(input: Record<string, unknown>, mappings: ProjectRequirements["fieldMappings"]): WebhookMappingPreview {
  const mappedPayload = Object.create(null) as Record<string, unknown>;
  const missingOptionalPaths: string[] = [];
  const missingRequiredPaths: string[] = [];

  for (const mapping of mappings) {
    const value = mapping.sourcePath.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return undefined;
      return (current as Record<string, unknown>)[key];
    }, input);
    if (value === undefined) {
      (mapping.required ? missingRequiredPaths : missingOptionalPaths).push(mapping.sourcePath);
      continue;
    }

    const path = mapping.targetPath.split(".");
    let target = mappedPayload;
    for (const segment of path.slice(0, -1)) {
      if (!target[segment] || typeof target[segment] !== "object" || Array.isArray(target[segment])) {
        target[segment] = Object.create(null) as Record<string, unknown>;
      }
      target = target[segment] as Record<string, unknown>;
    }
    target[path[path.length - 1]] = value;
  }

  return { mappedPayload, missingOptionalPaths, missingRequiredPaths };
}
