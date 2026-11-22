type N8nNode = { id?: unknown; name?: unknown; type?: unknown; parameters?: unknown; position?: unknown };

export type WorkflowDebugReview = { nodeCount: number; issues: string[]; securityNotes: string[] };

/** Finds likely inline credentials without returning their values to the caller. */
export function findInlineWorkflowSecrets(value: unknown) {
  const findings = new Set<string>();
  const sensitiveKey = /^(authorization|x[-_]?api[-_]?key|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|secret|bearer)$/i;
  const sensitiveName = /(authorization|x[-_]?api[-_]?key|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|secret)/i;
  const looksLikePlaceholder = (text: string) => !text.trim() || /^(=|\{\{|REPLACE_WITH|YOUR_[A-Z0-9_]+|<[^>]+>)/i.test(text.trim());
  const visit = (item: unknown, path: string): void => {
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const fieldName = typeof record.name === "string" ? record.name.trim() : "";
    if (sensitiveName.test(fieldName) && typeof record.value === "string" && !looksLikePlaceholder(record.value)) findings.add(`${path}.value`);
    for (const [key, child] of Object.entries(record)) {
      if (sensitiveKey.test(key) && typeof child === "string" && !looksLikePlaceholder(child)) findings.add(`${path}.${key}`);
      else if (typeof child === "object" && child !== null) visit(child, `${path}.${key}`);
    }
  };
  visit(value, "workflow");
  return [...findings].slice(0, 8);
}

/** Checks the generated n8n JSON contract before it is stored or offered for download. */
export function validateN8nWorkflow(value: unknown, options: { requireInactive?: boolean; allowCustomNodeTypes?: boolean } = {}) {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Workflow must be a JSON object."];
  const workflow = value as { name?: unknown; nodes?: unknown; connections?: unknown; active?: unknown };
  if (typeof workflow.name !== "string" || workflow.name.trim().length === 0) errors.push("Workflow needs a name.");
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) return [...errors, "Workflow needs at least one node."];
  const nodes = workflow.nodes as N8nNode[];
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const [index, node] of nodes.entries()) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      errors.push(`Node ${index + 1} is not an object.`);
      continue;
    }
    if (typeof node.name !== "string" || !node.name.trim()) errors.push(`Node ${index + 1} needs a name.`);
    else if (names.has(node.name)) errors.push(`Node name “${node.name}” is duplicated.`);
    else names.add(node.name);
    if (typeof node.id !== "string" || !node.id) errors.push(`Node ${index + 1} needs an ID.`);
    else if (ids.has(node.id)) errors.push(`Node ID for “${node.name ?? index + 1}” is duplicated.`);
    else ids.add(node.id);
    if (typeof node.type !== "string" || (!options.allowCustomNodeTypes && !node.type.startsWith("n8n-nodes-base."))) errors.push(`Node ${node.name ?? index + 1} has an unsupported node type.`);
    if (!node.parameters || typeof node.parameters !== "object" || Array.isArray(node.parameters)) errors.push(`Node ${node.name ?? index + 1} needs parameters.`);
    if (!Array.isArray(node.position) || node.position.length !== 2 || node.position.some((item) => typeof item !== "number")) errors.push(`Node ${node.name ?? index + 1} needs a valid canvas position.`);
  }
  if (options.requireInactive !== false && workflow.active !== false) errors.push("Generated workflows must remain inactive until a user reviews them.");
  if (!workflow.connections || typeof workflow.connections !== "object" || Array.isArray(workflow.connections)) errors.push("Workflow connections are missing.");
  else {
    const destinations: string[] = [];
    const visit = (item: unknown) => {
      if (Array.isArray(item)) return item.forEach(visit);
      if (!item || typeof item !== "object") return;
      const edge = item as Record<string, unknown>;
      if (typeof edge.node === "string") destinations.push(edge.node);
      Object.values(edge).forEach(visit);
    };
    visit(workflow.connections);
    for (const destination of destinations) if (!names.has(destination)) errors.push(`Connection points to missing node “${destination}”.`);
  }
  return errors;
}

/** Produces a small, secret-free review summary; the submitted workflow itself is never persisted. */
export function reviewN8nWorkflow(value: unknown): WorkflowDebugReview {
  const structuralIssues = validateN8nWorkflow(value, { requireInactive: false, allowCustomNodeTypes: true });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { nodeCount: 0, issues: ["The supplied JSON is not an n8n workflow object."], securityNotes: [] };
  }

  const workflow = value as { nodes?: unknown; active?: unknown };
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes as N8nNode[] : [];
  const issues = structuralIssues.slice(0, 8);
  const securityNotes: string[] = [];
  const serialized = JSON.stringify(value);
  if (/REPLACE_WITH|YOUR_[A-Z0-9_]+|<[^>]+>/i.test(serialized)) issues.push("The workflow still contains placeholder values.");
  const inlineSecretPaths = findInlineWorkflowSecrets(value);
  if (inlineSecretPaths.length) securityNotes.push(`Possible inline credentials were found at ${inlineSecretPaths.join(", ")}. Remove the values and use the platform credential manager.`);

  nodes.forEach((node, index) => {
    const parameters = node?.parameters && typeof node.parameters === "object" ? node.parameters as Record<string, unknown> : {};
    if (node?.type === "n8n-nodes-base.httpRequest") {
      const credentials = (node as N8nNode & { credentials?: Record<string, unknown> }).credentials;
      if (!credentials || Object.keys(credentials).length === 0) issues.push(`HTTP Request node ${index + 1} has no credential reference in this JSON.`);
      if (typeof parameters.url === "string" && /^http:\/\//i.test(parameters.url.trim())) {
        securityNotes.push(`HTTP Request node ${index + 1} uses a plain HTTP destination. Use HTTPS when the destination supports it.`);
      }
    }
    if (node?.type === "n8n-nodes-base.webhook") {
      if (!parameters.authentication || parameters.authentication === "none") securityNotes.push(`Webhook node ${index + 1} appears to have no authentication configured.`);
    }
  });

  return {
    nodeCount: nodes.length,
    issues: [...new Set(issues)].slice(0, 12),
    securityNotes: [...new Set(securityNotes)].slice(0, 6),
  };
}

export function verifyN8nWorkflow(value: unknown, scenario = "generic_scaffold") {
  const structureErrors = validateN8nWorkflow(value, { allowCustomNodeTypes: scenario === "imported_n8n" });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      status: "needs_setup" as const,
      checks: [{ id: "structure", label: "Workflow JSON structure", passed: false, detail: structureErrors.join(" ") }],
    };
  }
  const workflow = value as { active?: unknown; nodes?: N8nNode[] };
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const names = nodes.map((node) => typeof node?.name === "string" ? node.name : "");
  const serialized = JSON.stringify(value);
  const hasPlaceholders = /REPLACE_WITH|YOUR_[A-Z0-9_]+|<[^>]+>/i.test(serialized);
  const httpNodes = nodes.filter((node) => node.type === "n8n-nodes-base.httpRequest");
  const webhookNodes = nodes.filter((node) => node.type === "n8n-nodes-base.webhook");
  const webhookAuthConfigured = webhookNodes.length === 0 || webhookNodes.every((node) => {
    const parameters = node.parameters && typeof node.parameters === "object" ? node.parameters as Record<string, unknown> : {};
    const credentials = (node as N8nNode & { credentials?: Record<string, { id?: string }> }).credentials;
    const credentialId = credentials?.httpHeaderAuth?.id;
    return parameters.authentication === "headerAuth" && typeof credentialId === "string" && credentialId.length > 0 && credentialId !== "AUTQORA_CREDENTIAL_ID_REQUIRED";
  });
  const authenticatedHttpNodes = httpNodes.filter((node) => {
    const parameters = node.parameters && typeof node.parameters === "object" ? node.parameters as Record<string, unknown> : {};
    return parameters.authentication !== "none";
  });
  const credentialNodes = nodes.filter((node) => {
    const type = typeof node.type === "string" ? node.type : "";
    const credentials = (node as N8nNode & { credentials?: Record<string, unknown> }).credentials;
    return /googleSheets|gmail|youTube/i.test(type) || Boolean(credentials && Object.keys(credentials).length > 0) || authenticatedHttpNodes.includes(node);
  });
  const credentialConfigured = credentialNodes.every((node) => {
    const credentials = (node as N8nNode & { credentials?: Record<string, { id?: string; name?: string }> }).credentials;
    return Boolean(credentials && Object.keys(credentials).length > 0 && Object.values(credentials).every((credential) =>
      typeof credential.id === "string" && credential.id.trim().length > 0 && !/^(REPLACE_WITH|YOUR_)/i.test(credential.id)
      && typeof credential.name === "string" && credential.name.trim().length > 0,
    ));
  });
  const structuralPass = structureErrors.length === 0;
  const placeholdersPass = !hasPlaceholders;
  const scenarioPass = scenario === "imported_n8n" || scenario === "ai_generated_n8n"
    ? structuralPass
    : scenario === "instagram_photo_post"
    ? names.some((name) => /instagram post details/i.test(name)) && names.some((name) => /media container/i.test(name)) && names.some((name) => /publish instagram/i.test(name))
    : scenario === "webhook_intake"
      ? names.some((name) => /receive webhook request/i.test(name)) && names.some((name) => /return accepted response/i.test(name))
      : scenario === "webhook_api_forward"
        ? names.some((name) => /receive webhook request/i.test(name)) && names.some((name) => /send data to/i.test(name)) && names.some((name) => /return accepted response/i.test(name))
      : scenario === "google_sheets_lead_email"
        ? nodes.some((node) => node.type === "n8n-nodes-base.googleSheetsTrigger") && nodes.some((node) => node.type === "n8n-nodes-base.code" && /validate lead email/i.test(String(node.name))) && nodes.some((node) => node.type === "n8n-nodes-base.gmail")
      : scenario === "youtube_video_clips"
        ? names.some((name) => /start clip generation/i.test(name)) && names.some((name) => /create vertical clips with ffmpeg/i.test(name)) && names.some((name) => /return clip download links/i.test(name))
        : scenario === "youtube_clip_publishing_pipeline"
          ? names.some((name) => /start clip generation/i.test(name))
            && names.some((name) => /create vertical clips with ffmpeg/i.test(name))
            && names.some((name) => /return clip download links/i.test(name))
            && names.some((name) => /upload youtube short as private/i.test(name))
            && names.some((name) => /create instagram reel upload session/i.test(name))
            && names.some((name) => /upload reel video bytes to meta/i.test(name))
            && names.some((name) => /publish instagram reel/i.test(name))
      : scenario === "generic_scaffold"
        ? names.some((name) => /when clicking.*execute workflow/i.test(name)) && names.some((name) => /autqora implementation draft/i.test(name))
        : false;
  const status = structuralPass && placeholdersPass && webhookAuthConfigured && credentialConfigured
    && scenarioPass ? "ready_for_manual_test" as const
    : "needs_setup" as const;
  const checks = [
    {
      id: "structure",
      label: "Workflow structure and node connections",
      passed: structuralPass,
      detail: structuralPass ? "Required workflow fields and connection targets are present." : structureErrors.join(" "),
    },
    {
      id: "inactive",
      label: "Workflow remains inactive",
      passed: workflow.active === false,
      detail: workflow.active === false ? "Export will not run until the user enables it in n8n." : "Generated workflows must remain inactive until reviewed.",
    },
    {
      id: "scenario_nodes",
      label: scenario === "imported_n8n" ? "Imported workflow structure" : "Scenario-specific nodes",
      passed: scenarioPass,
      detail: scenarioPass ? scenario === "ai_generated_n8n"
        ? "AI-generated n8n draft passed structural checks. Review every node and credential in n8n; this does not prove provider behavior or execution."
        : scenario === "instagram_photo_post"
        ? "Instagram photo-post steps were found. This does not prove n8n import or Meta API compatibility."
        : scenario === "imported_n8n"
          ? "Imported n8n structure passed local checks. This does not prove provider behavior, credentials, or execution."
        : scenario === "webhook_api_forward"
          ? names.some((name) => /map destination fields/i.test(name))
            ? "Webhook intake, configured field mapping, HTTP forwarding, and response steps were found. This does not prove endpoint or credential validity."
            : "Webhook, HTTP forwarding, and response steps were found. This does not prove endpoint or credential validity."
        : scenario === "google_sheets_lead_email"
          ? "Google Sheets row trigger, email validation, and Gmail notification nodes were found. Import and test the provider credentials in n8n before enabling it."
        : scenario === "youtube_video_clips"
          ? "Manual run, clip-worker request, clip-link output, and optional private YouTube upload steps were found. YouTube uploads require explicit opt-in and OAuth; this does not capture live streams or publish to Instagram."
        : scenario === "youtube_clip_publishing_pipeline"
          ? "Archived-video clip generation and opt-in YouTube/Instagram upload steps were found. Provider credentials and user opt-in are required; live capture, meaningful-moment selection, and an in-workflow review gate are not included."
          : "Webhook intake and JSON response steps were found. This does not prove n8n import or a live request."
        : "No implemented scenario-specific workflow was detected; this export is a generic scaffold.",
    },
    {
      id: "placeholders",
      label: "Required values configured",
      passed: placeholdersPass,
      detail: placeholdersPass ? "No obvious placeholder markers found." : "Fill every value marked REPLACE_WITH or YOUR_ before running the workflow.",
    },
    {
      id: "credentials",
      label: "External credentials configured",
      passed: credentialConfigured,
      detail: credentialNodes.length === 0 ? "No external credential is required by this workflow." : credentialConfigured ? "Credential references were detected; credential validity was not checked." : "Select the required Google, Gmail, clip-worker, YouTube OAuth2, Meta Header Auth, or destination credentials inside n8n; AUTQORA never stores their secret values.",
    },
    ...(webhookNodes.length ? [{
      id: "webhook_auth",
      label: "Incoming webhook authentication",
      passed: webhookAuthConfigured,
      detail: webhookAuthConfigured ? "Webhook Header Auth is bound to an n8n credential reference. The credential's secret value was not inspected." : "Create a Header Auth credential in n8n, select it on the Webhook node, and re-import the updated workflow to record its actual credential reference.",
    }] : []),
    {
      id: "runtime",
      label: "n8n import and live execution",
      passed: false,
      detail: "Not run by AUTQORA. Import into your n8n instance and perform a carefully reviewed manual test.",
    },
  ];
  return { status, checks };
}
