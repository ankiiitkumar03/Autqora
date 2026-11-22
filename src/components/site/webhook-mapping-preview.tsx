"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Play } from "lucide-react";
import type { ProjectRequirements } from "@/lib/project-domain";

type PreviewResponse = {
  mappedPayload?: Record<string, unknown>;
  missingOptionalPaths?: string[];
  missingRequiredPaths?: string[];
  error?: string;
  persisted?: boolean;
};

export function WebhookMappingPreview({ projectId, mappings, requirementsSaved }: { projectId: string; mappings: ProjectRequirements["fieldMappings"]; requirementsSaved: boolean }) {
  const [payloadText, setPayloadText] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(null);
    setError("");
  }, [JSON.stringify(mappings), requirementsSaved]);

  if (mappings.length === 0) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setError("Enter valid JSON before previewing.");
      setBusy(false);
      return;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      setError("The sample must be a JSON object.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/mapping-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ payload }),
      });
      const result = (await response.json()) as PreviewResponse;
      if (!response.ok) {
        setPreview(result.missingRequiredPaths ? result : null);
        throw new Error(result.error ?? "Could not preview these mappings.");
      }
      setPreview(result);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Could not preview these mappings.");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby="mapping-preview-title" className="mt-4 rounded-xl border border-white/[0.08] bg-black/15 p-4">
    <h3 id="mapping-preview-title" className="text-xs font-medium text-white/80">Preview saved mappings</h3>
    <p className="mt-1 text-[11px] leading-relaxed text-white/50">Use synthetic JSON only. The preview runs locally, calls no destination, and does not persist the sample or result. Save mapping changes first.</p>
    <form onSubmit={(event) => void submit(event)} className="mt-3 space-y-3">
      <label htmlFor="webhook-mapping-sample" className="block text-[11px] font-medium text-white/65">Sample request body</label>
      <textarea id="webhook-mapping-sample" value={payloadText} onChange={(event) => setPayloadText(event.target.value)} maxLength={32_768} rows={6} placeholder={'{\n  "body": {\n    "email": "user@example.test"\n  }\n}'} className="w-full rounded-lg border border-white/[0.1] bg-[#08060c] px-3 py-2 font-mono text-xs text-white/80 outline-none placeholder:text-white/25 focus-visible:border-violet-soft/60" />
      <button type="submit" disabled={busy || !requirementsSaved || payloadText.trim().length === 0} className="inline-flex h-9 items-center gap-2 rounded-full border border-violet-soft/25 px-3 text-xs text-white/80 hover:bg-violet/[0.1] disabled:opacity-45">{busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{busy ? "Previewing" : "Preview mapping"}</button>
      {!requirementsSaved && <p className="text-[11px] text-amber-100/75">Save the current requirements before previewing.</p>}
    </form>
    {error && <p role="alert" className="mt-3 text-xs text-[#f58ba0]">{error}</p>}
    {preview?.missingRequiredPaths && <div role="status" className="mt-3 rounded-lg border border-amber-200/20 bg-amber-100/[0.04] p-3 text-xs text-amber-50/80"><p>These required source fields are missing, so n8n will stop before forwarding:</p><ul className="mt-1 list-inside list-disc">{preview.missingRequiredPaths.map((path) => <li key={path}><code>{path}</code></li>)}</ul></div>}
    {preview?.mappedPayload && <div className="mt-3"><p role="status" className="text-[11px] text-emerald-200">Preview only · not saved or sent</p><pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-[#08060c] p-3 text-[11px] leading-relaxed text-white/75">{JSON.stringify(preview.mappedPayload, null, 2)}</pre>{preview.missingOptionalPaths && preview.missingOptionalPaths.length > 0 && <p className="mt-2 text-[11px] text-white/50">Skipped missing optional fields: {preview.missingOptionalPaths.map((path) => <code key={path} className="ml-1">{path}</code>)}</p>}</div>}
  </section>;
}
