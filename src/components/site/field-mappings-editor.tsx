"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProjectRequirements } from "@/lib/project-domain";

type FieldMapping = ProjectRequirements["fieldMappings"][number];

export function FieldMappingsEditor({ mappings, onChange, idPrefix }: { mappings: FieldMapping[]; onChange: (mappings: FieldMapping[]) => void; idPrefix: string }) {
  const inputClass = "h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-sm text-white/85 outline-none placeholder:text-white/30 focus-visible:border-violet-soft/60";
  return <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-medium text-white/80">Field mappings <span className="font-normal text-white/45">Optional · max 20</span></p><p className="mt-1 text-[11px] leading-relaxed text-white/45">Use dot paths. Example: <code>body.email</code> → <code>contact.email</code>.</p></div>
      <button type="button" disabled={mappings.length >= 20} onClick={() => onChange([...mappings, { sourcePath: "", targetPath: "", required: false }])} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.14] px-3 text-xs text-white/70 hover:bg-white/[0.05] disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add mapping</button>
    </div>
    {mappings.length > 0 && <ul className="mt-4 space-y-2">{mappings.map((mapping, index) => <li key={`${idPrefix}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
      <div><label htmlFor={`${idPrefix}-source-${index}`} className="sr-only">Source field path</label><input id={`${idPrefix}-source-${index}`} required maxLength={160} pattern="[A-Za-z0-9_$-]+(\.[A-Za-z0-9_$-]+)*" title="Use dot notation, such as body.email" value={mapping.sourcePath} onChange={(event) => onChange(mappings.map((item, itemIndex) => itemIndex === index ? { ...item, sourcePath: event.target.value } : item))} placeholder="body.email" className={inputClass} /></div>
      <span aria-hidden="true" className="hidden text-xs text-white/35 sm:block">→</span>
      <div><label htmlFor={`${idPrefix}-target-${index}`} className="sr-only">Destination field path</label><input id={`${idPrefix}-target-${index}`} required maxLength={160} pattern="[A-Za-z0-9_$-]+(\.[A-Za-z0-9_$-]+)*" title="Use dot notation, such as contact.email" value={mapping.targetPath} onChange={(event) => onChange(mappings.map((item, itemIndex) => itemIndex === index ? { ...item, targetPath: event.target.value } : item))} placeholder="contact.email" className={inputClass} /></div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-white/60"><input type="checkbox" checked={mapping.required} onChange={(event) => onChange(mappings.map((item, itemIndex) => itemIndex === index ? { ...item, required: event.target.checked } : item))} className="accent-violet-soft" /> Required</label>
        <button type="button" aria-label={`Remove mapping ${index + 1}`} onClick={() => onChange(mappings.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] text-white/50 hover:border-[#f0567a]/30 hover:text-[#f58ba0]"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>)}</ul>}
  </div>;
}
