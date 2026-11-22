"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { debugPlatforms, type DebugDiagnosis, type DebugPlatform } from "@/lib/debug-diagnostics";

export function DebugWorkbench() {
  const [platform, setPlatform] = useState<DebugPlatform>("n8n");
  const [errorText, setErrorText] = useState("");
  const [expected, setExpected] = useState("");
  const [diagnosis, setDiagnosis] = useState<DebugDiagnosis | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDiagnosis(null);
    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, error: errorText, expected }),
      });
      const result = (await response.json()) as {
        diagnosis?: DebugDiagnosis;
        error?: string;
      };

      if (!response.ok || !result.diagnosis) {
        setFormError(result.error ?? "The diagnosis could not be generated. Please try again.");
        return;
      }

      setDiagnosis(result.diagnosis);
    } catch {
      setFormError("Couldn’t reach the diagnosis service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-5 px-5 pb-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/[0.09] bg-[#0a0810] p-5 sm:p-7"
      >
        <div className="flex items-center gap-2 font-mono-brand text-[9px] uppercase tracking-[0.18em] text-violet-soft/80">
          <Sparkles className="h-3.5 w-3.5" />
          Debugging workspace
        </div>
        <h2 className="mt-4 font-display text-[1.45rem] tracking-[-0.04em] text-mist">
          Describe the failure.
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/40">
          Choose the platform and paste the exact error. A rule-based check will suggest where to look next.
        </p>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="debug-platform" className="mb-2 block text-[11px] font-medium text-white/65">
              Platform
            </label>
            <select
              id="debug-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as DebugPlatform)}
              className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#100d17] px-3 text-[13px] text-white/80 outline-none focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
            >
              {debugPlatforms.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="debug-error" className="text-[11px] font-medium text-white/65">
                Error message or log
              </label>
              <span className="font-mono-brand text-[8px] text-white/25">Up to 8,000 characters</span>
            </div>
            <textarea
              id="debug-error"
              required
              minLength={5}
              maxLength={8_000}
              rows={9}
              value={errorText}
              onChange={(event) => setErrorText(event.target.value)}
              placeholder={'Example: HTTP 401 invalid_grant — refresh token expired'}
              className="w-full resize-y rounded-lg border border-white/[0.1] bg-[#060409] px-3 py-3 font-mono-brand text-[11px] leading-relaxed text-white/75 outline-none placeholder:text-white/20 focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
            />
            <div className="mt-1 text-right font-mono-brand text-[8px] text-white/22">
              {errorText.length.toLocaleString()} / 8,000
            </div>
          </div>

          <div>
            <label htmlFor="debug-expected" className="mb-2 block text-[11px] font-medium text-white/65">
              What did you expect to happen? <span className="font-normal text-white/30">Optional</span>
            </label>
            <textarea
              id="debug-expected"
              maxLength={1_000}
              rows={3}
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
              placeholder="For example: create one contact, then send a Slack alert"
              className="w-full resize-y rounded-lg border border-white/[0.1] bg-[#060409] px-3 py-2.5 text-[12px] leading-relaxed text-white/75 outline-none placeholder:text-white/20 focus-visible:border-violet-soft/60 focus-visible:ring-2 focus-visible:ring-violet/30"
            />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber/15 bg-amber/[0.035] p-3">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber/70" />
          <p className="text-[10.5px] leading-relaxed text-white/40">
            Remove passwords, API keys, tokens, personal data, and customer records before submitting. This app does not save your input; the server redacts common credential formats before checking the error.
          </p>
        </div>

        {formError && (
          <p role="alert" className="mt-4 rounded-lg border border-[#f0567a]/20 bg-[#f0567a]/[0.05] px-3 py-2.5 text-[11px] text-[#f58ba0]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || errorText.trim().length < 5}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mist px-5 text-[12.5px] font-medium text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isSubmitting ? (
            <><LoaderCircle className="h-4 w-4 animate-spin" /> Checking error</>
          ) : (
            <>Get diagnosis <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
        <p className="mt-3 text-center text-[9.5px] leading-relaxed text-white/25">
          Rule-based guidance only. It does not connect to your platform or run your workflow.
        </p>
      </form>

      <section
        aria-live="polite"
        aria-busy={isSubmitting}
        className="min-h-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 sm:p-7"
      >
        {isSubmitting ? (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
            <LoaderCircle className="h-7 w-7 animate-spin text-violet-soft/70" />
            <p className="mt-4 font-display text-[14px] text-white/65">Reading the error pattern</p>
            <p className="mt-1 text-[11px] text-white/30">Your input is processed for this request only.</p>
          </div>
        ) : diagnosis ? (
          <div>
            <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-violet-soft/65">
              Suggested diagnosis
            </p>
            <h2 className="mt-3 font-display text-[1.45rem] leading-tight tracking-[-0.04em] text-mist">
              {diagnosis.category}
            </h2>
            <p className="mt-3 rounded-xl border border-violet/15 bg-violet/[0.04] p-3.5 text-[12px] leading-relaxed text-white/65">
              {diagnosis.summary}
            </p>
            <p className="mt-4 text-[11.5px] leading-relaxed text-white/42">
              {diagnosis.explanation}
            </p>

            <h3 className="mt-7 font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/35">
              Checks to try
            </h3>
            <ol className="mt-3 space-y-2.5">
              {diagnosis.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-2.5 rounded-lg border border-white/[0.055] bg-black/10 px-3 py-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet/25 font-mono-brand text-[8px] text-violet-soft/80">
                    {index + 1}
                  </span>
                  <span className="text-[11px] leading-relaxed text-white/55">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3.5">
              <p className="font-mono-brand text-[8px] uppercase tracking-[0.15em] text-white/30">Useful next evidence</p>
              <p className="mt-2 text-[10.5px] leading-relaxed text-white/45">{diagnosis.evidence}</p>
            </div>

            <p className="mt-4 border-l border-amber/30 pl-3 text-[10px] leading-relaxed text-amber/60">
              {diagnosis.note}
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
              <Sparkles className="h-5 w-5 text-violet-soft/55" />
            </span>
            <h2 className="mt-5 font-display text-[15px] text-white/70">Your diagnosis will appear here</h2>
            <p className="mt-2 max-w-xs text-[11px] leading-relaxed text-white/32">
              Start with the exact error and the platform where it happened. The helper will match common failure patterns and suggest checks.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
