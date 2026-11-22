"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, FolderKanban, LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { projectPlatforms, projectStatuses, type Project, type ProjectRequirements, type ProjectStatus } from "@/lib/project-domain";
import { FieldMappingsEditor } from "@/components/site/field-mappings-editor";

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Brief saved",
  planning: "Planning",
  building: "Building",
  verification: "Verification",
  complete: "Complete (manual)",
};

type ProjectResponse = { project?: Project; error?: string };
type ProjectsResponse = { projects?: Project[]; error?: string };

export function ProjectsWorkspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [trigger, setTrigger] = useState("");
  const [sourceApp, setSourceApp] = useState("");
  const [destinationApp, setDestinationApp] = useState("");
  const [fieldMappings, setFieldMappings] = useState<ProjectRequirements["fieldMappings"]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [budget, setBudget] = useState("unknown");
  const [technicalComfort, setTechnicalComfort] = useState("unknown");
  const [constraints, setConstraints] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store", signal });
      const result = (await response.json()) as ProjectsResponse;
      if (!response.ok) throw new Error(result.error ?? "Could not load projects.");
      setProjects(result.projects ?? []);
      setError("");
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Could not load projects.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, goal, platform: platform || null,
          requirements: { trigger, sourceApp, destinationApp, fieldMappings, monthlyVolume, budget, technicalComfort, constraints },
        }),
      });
      const result = (await response.json()) as ProjectResponse;
      if (!response.ok || !result.project) throw new Error(result.error ?? "Could not save project.");
      setProjects((current) => [result.project!, ...current].slice(0, 100));
      setName("");
      setGoal("");
      setPlatform("");
      setTrigger("");
      setSourceApp("");
      setDestinationApp("");
      setFieldMappings([]);
      setMonthlyVolume("");
      setBudget("unknown");
      setTechnicalComfort("unknown");
      setConstraints("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save project.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(project: Project, status: ProjectStatus) {
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as ProjectResponse;
      if (!response.ok || !result.project) throw new Error(result.error ?? "Could not update project.");
      setProjects((current) => current.map((item) => item.id === project.id ? result.project! : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update project.");
    }
  }

  async function removeProject(project: Project) {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as ProjectResponse;
        throw new Error(result.error ?? "Could not delete project.");
      }
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete project.");
    }
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-5 px-5 pb-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
      <form onSubmit={createProject} className="h-fit rounded-2xl border border-white/[0.09] bg-[#0a0810] p-4 sm:p-6">
        <div className="flex items-center gap-2 font-mono-brand text-[9px] uppercase tracking-[0.18em] text-violet-soft/80">
          <Plus className="h-3.5 w-3.5" /> New project brief
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">
          Start by naming the workflow and describing the outcome you want. Keep credentials and personal data out of the brief.
        </p>

        <label htmlFor="project-name" className="mb-2 mt-6 block text-[12px] font-medium text-white/75">Project name</label>
        <input
          id="project-name"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Route qualified leads"
          className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[13px] text-white/80 outline-none placeholder:text-white/20 focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
        />

        <label htmlFor="project-goal" className="mb-2 mt-5 block text-[12px] font-medium text-white/75">What should this automation do?</label>
        <textarea
          id="project-goal"
          required
          minLength={10}
          maxLength={4_000}
          rows={6}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Describe the trigger, the information to process, and what should happen next."
          className="w-full resize-y rounded-lg border border-white/[0.1] bg-[#060409] px-3 py-3 text-[12px] leading-relaxed text-white/75 outline-none placeholder:text-white/20 focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
        />

        <label htmlFor="project-platform" className="mb-2 mt-5 block text-[12px] font-medium text-white/75">Preferred platform <span className="font-normal text-white/45">Optional</span></label>
        <select
          id="project-platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[13px] text-white/80 outline-none focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
        >
          <option value="">Not decided yet</option>
          {projectPlatforms.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>

        <details className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
          <summary className="cursor-pointer text-[12px] font-medium text-violet-soft">Add details for a better plan <span className="font-normal text-white/45">Optional</span></summary>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="project-trigger" className="block text-[11px] font-medium text-white/70">What starts it?</label><input id="project-trigger" maxLength={500} value={trigger} onChange={(event) => setTrigger(event.target.value)} placeholder="e.g. new form submission, every weekday" className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[12px] text-white/80 placeholder:text-white/30" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="project-source" className="block text-[11px] font-medium text-white/70">Source app</label><input id="project-source" maxLength={100} value={sourceApp} onChange={(event) => setSourceApp(event.target.value)} placeholder="e.g. Google Forms" className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[12px] text-white/80 placeholder:text-white/30" /></div>
              <div><label htmlFor="project-destination" className="block text-[11px] font-medium text-white/70">Destination app</label><input id="project-destination" maxLength={100} value={destinationApp} onChange={(event) => setDestinationApp(event.target.value)} placeholder="e.g. Google Sheets" className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[12px] text-white/80 placeholder:text-white/30" /></div>
            </div>
            <FieldMappingsEditor mappings={fieldMappings} onChange={setFieldMappings} idPrefix="new-project-mapping" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="project-volume" className="block text-[11px] font-medium text-white/70">Approx. volume</label><input id="project-volume" maxLength={100} value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value)} placeholder="e.g. 500 / month" className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[12px] text-white/80 placeholder:text-white/30" /></div>
              <div><label htmlFor="project-budget" className="block text-[11px] font-medium text-white/70">Monthly tool budget</label><select id="project-budget" value={budget} onChange={(event) => setBudget(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-2 text-[12px] text-white/80"><option value="unknown">Not sure</option><option value="free">Free only</option><option value="under_25">Under $25</option><option value="under_100">Under $100</option><option value="flexible">Flexible</option></select></div>
              <div><label htmlFor="project-comfort" className="block text-[11px] font-medium text-white/70">Technical comfort</label><select id="project-comfort" value={technicalComfort} onChange={(event) => setTechnicalComfort(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-2 text-[12px] text-white/80"><option value="unknown">Not sure</option><option value="beginner">Beginner</option><option value="comfortable">Some experience</option><option value="advanced">Advanced</option></select></div>
            </div>
            <div><label htmlFor="project-constraints" className="block text-[11px] font-medium text-white/70">Constraints or must-haves</label><textarea id="project-constraints" maxLength={1000} rows={2} value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Self-hosted, no-code, data privacy needs…" className="mt-2 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 py-2 text-[12px] text-white/80 placeholder:text-white/30" /></div>
          </div>
        </details>

        {error && <p role="alert" className="mt-4 rounded-lg border border-[#f0567a]/20 bg-[#f0567a]/[0.05] px-3 py-2.5 text-[11px] text-[#f58ba0]">{error}</p>}

        <button
          type="submit"
          disabled={isSaving || name.trim().length < 2 || goal.trim().length < 10}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mist px-5 text-[12.5px] font-medium text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/[0.14] disabled:text-white/70 disabled:ring-1 disabled:ring-white/[0.16]"
        >
          {isSaving ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving project</> : <>Save project brief <ArrowUpRight className="h-4 w-4" /></>}
        </button>
      </form>

      <section aria-live="polite" className="min-w-0">
        <div className="flex items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <p className="font-mono-brand text-[9px] uppercase tracking-[0.18em] text-white/55">Your workspace</p>
            <h2 className="mt-2 font-display text-[1.5rem] tracking-[-0.04em] text-mist">Automation projects</h2>
          </div>
          <span className="shrink-0 font-mono-brand text-[10px] text-white/50">{projects.length} / 100</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-[11px] text-white/35"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading projects</div>
        ) : projects.length === 0 ? (
          <div className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] px-5 text-center">
            <FolderKanban className="h-6 w-6 text-violet-soft/50" />
            <h3 className="mt-4 font-display text-[14px] text-white/65">Your first brief starts here</h3>
            <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-white/55">Save an automation goal and it will be here when you return on this browser.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <article key={project.id} className="min-w-0 rounded-xl border border-white/[0.075] bg-white/[0.015] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-display text-[14px] font-medium text-white/80">{project.name}</h3>
                    <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/60">{project.goal}</p>
                  </div>
                  <button type="button" onClick={() => void removeProject(project)} aria-label={`Delete ${project.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-white/30 transition-colors hover:border-[#f0567a]/20 hover:text-[#f58ba0]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/50">
                    <span>{project.platform ?? "Platform not chosen"}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={project.updatedAt}>Updated {new Date(project.updatedAt).toLocaleDateString()}</time>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-[10px] text-white/55">
                      Stage
                      <select value={project.status} onChange={(event) => void updateStatus(project, event.target.value as ProjectStatus)} className="h-8 rounded-md border border-white/[0.1] bg-[#100d17] px-2 text-[10px] text-white/70 outline-none focus-visible:border-violet-soft/60">
                        {projectStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </select>
                    </label>
                    <Link href={`/projects/${project.id}`} className="inline-flex h-8 items-center rounded-full border border-violet-soft/30 px-3 text-[10px] font-medium text-violet-soft transition-colors hover:bg-violet/[0.12] hover:text-white">
                      Open plan <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-violet/12 bg-violet/[0.025] p-4">
          <p className="font-mono-brand text-[9px] uppercase tracking-[0.15em] text-violet-soft/80">Project workflow</p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/60">Open a project to refine its requirements, review a plan and tool fit, generate or import a versioned n8n workflow, and track setup, verification, debugging, and deployment guidance. Live execution stays in your automation platform.</p>
        </div>
      </section>
    </div>
  );
}
