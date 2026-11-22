"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { ProjectRequirements } from "@/lib/project-domain";
import { FieldMappingsEditor } from "@/components/site/field-mappings-editor";
import { WebhookMappingPreview } from "@/components/site/webhook-mapping-preview";

type SaveResponse = { requirements?: ProjectRequirements; error?: string };

export function ProjectRequirementsEditor({ projectId, initialRequirements, onSaved }: { projectId: string; initialRequirements: ProjectRequirements; onSaved?: () => void }) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ProjectRequirements>(key: K, value: ProjectRequirements[K]) {
    setRequirements((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requirements),
      });
      const result = (await response.json()) as SaveResponse;
      if (!response.ok || !result.requirements) throw new Error(result.error ?? "Could not save requirements.");
      setRequirements(result.requirements);
      setSaved(true);
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save requirements.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-sm text-white/85 outline-none placeholder:text-white/35 focus-visible:border-violet-soft/60";
  return (
    <details className="mt-6 rounded-2xl border border-white/[0.1] bg-[#0a0810] p-5 sm:p-6">
      <summary className="cursor-pointer font-medium text-white">Edit project requirements <span className="ml-1 text-xs font-normal text-white/50">Apps, trigger, endpoint, budget, and constraints</span></summary>
      <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
        <div><label htmlFor="req-trigger" className="block text-xs font-medium text-white/70">What starts it?</label><input id="req-trigger" maxLength={500} value={requirements.trigger} onChange={(event) => update("trigger", event.target.value)} className={inputClass} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="req-source" className="block text-xs font-medium text-white/70">Source app</label><input id="req-source" maxLength={100} value={requirements.sourceApp} onChange={(event) => update("sourceApp", event.target.value)} className={inputClass} /></div>
          <div><label htmlFor="req-destination" className="block text-xs font-medium text-white/70">Destination app</label><input id="req-destination" maxLength={100} value={requirements.destinationApp} onChange={(event) => update("destinationApp", event.target.value)} className={inputClass} /></div>
        </div>
        <div><label htmlFor="req-endpoint" className="block text-xs font-medium text-white/70">Destination API endpoint <span className="font-normal text-white/45">Optional · used by webhook-to-API exports</span></label><input id="req-endpoint" type="url" maxLength={500} value={requirements.destinationEndpoint} onChange={(event) => update("destinationEndpoint", event.target.value)} placeholder="https://api.example.com/v1/records" className={inputClass} /><p className="mt-1 text-xs leading-relaxed text-white/45">Use HTTPS, or a localhost / host.docker.internal URL for local development. Do not include tokens, passwords, or API keys in the URL; connect credentials inside n8n.</p></div>
        <div className="max-w-sm"><label htmlFor="req-method" className="block text-xs font-medium text-white/70">Destination HTTP method</label><select id="req-method" value={requirements.destinationMethod} onChange={(event) => update("destinationMethod", event.target.value as ProjectRequirements["destinationMethod"])} className={inputClass}><option value="POST">POST · create or submit</option><option value="PUT">PUT · replace or upsert</option><option value="PATCH">PATCH · update fields</option></select><p className="mt-1 text-xs leading-relaxed text-white/45">Confirm the method with your destination API. AUTQORA does not infer its API contract.</p></div>
        <div className="max-w-sm"><label htmlFor="req-auth" className="block text-xs font-medium text-white/70">Destination authentication</label><select id="req-auth" value={requirements.destinationAuth} onChange={(event) => update("destinationAuth", event.target.value as ProjectRequirements["destinationAuth"])} className={inputClass}><option value="none">No authentication</option><option value="httpHeaderAuth">Header Auth</option><option value="httpBasicAuth">Basic Auth</option></select><p className="mt-1 text-xs leading-relaxed text-white/45">Choose the API’s documented method. Create/select the actual credential in n8n; AUTQORA never stores the secret.</p></div>
        <FieldMappingsEditor mappings={requirements.fieldMappings} onChange={(mappings) => update("fieldMappings", mappings)} idPrefix="edit-mapping" />
        <WebhookMappingPreview projectId={projectId} mappings={requirements.fieldMappings} requirementsSaved={saved || requirements === initialRequirements} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="req-volume" className="block text-xs font-medium text-white/70">Approx. monthly volume</label><input id="req-volume" maxLength={100} value={requirements.monthlyVolume} onChange={(event) => update("monthlyVolume", event.target.value)} className={inputClass} /></div>
          <div><label htmlFor="req-budget" className="block text-xs font-medium text-white/70">Budget</label><select id="req-budget" value={requirements.budget} onChange={(event) => update("budget", event.target.value as ProjectRequirements["budget"])} className={inputClass}><option value="unknown">Not sure</option><option value="free">Free only</option><option value="under_25">Under $25/month</option><option value="under_100">Under $100/month</option><option value="flexible">Flexible</option></select></div>
          <div><label htmlFor="req-comfort" className="block text-xs font-medium text-white/70">Technical comfort</label><select id="req-comfort" value={requirements.technicalComfort} onChange={(event) => update("technicalComfort", event.target.value as ProjectRequirements["technicalComfort"])} className={inputClass}><option value="unknown">Not sure</option><option value="beginner">Beginner</option><option value="comfortable">Some experience</option><option value="advanced">Advanced</option></select></div>
        </div>
        <div><label htmlFor="req-constraints" className="block text-xs font-medium text-white/70">Constraints and must-haves</label><textarea id="req-constraints" maxLength={1000} rows={3} value={requirements.constraints} onChange={(event) => update("constraints", event.target.value)} className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 py-2 text-sm text-white/85 outline-none focus-visible:border-violet-soft/60" /></div>
        {error && <p role="alert" className="text-sm text-[#f58ba0]">{error}</p>}
        <div className="flex items-center gap-3"><button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full bg-mist px-4 text-sm font-medium text-ink disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busy ? "Saving" : "Save requirements"}</button>{saved && <span role="status" className="text-sm text-emerald-200">Requirements saved.</span>}</div>
      </form>
    </details>
  );
}
