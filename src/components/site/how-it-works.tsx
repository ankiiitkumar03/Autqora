import { SectionHeading } from "@/components/site/section-heading";

const steps = [
  {
    number: "01",
    title: "Describe",
    copy: "State the outcome in plain language. AUTQORA asks only the questions that change the build.",
    output: "Structured brief",
  },
  {
    number: "02",
    title: "Architect",
    copy: "Get a stack-aware roadmap: tools, data flow, permissions, cost and failure modes.",
    output: "Implementation plan",
  },
  {
    number: "03",
    title: "Generate",
    copy: "Produce n8n JSON, Python, API configs and environment templates. Import, don’t rebuild.",
    output: "Ready-to-run files",
  },
  {
    number: "04",
    title: "Debug",
    copy: "Bring logs, screenshots or workflow files. Get the root cause and a targeted fix.",
    output: "Patch + explanation",
  },
  {
    number: "05",
    title: "Verify & deploy",
    copy: "Test against real cases, record the evidence, then ship with alerts and a rollback path.",
    output: "Production-ready system",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-white/[0.06] py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet/30 to-transparent" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            index="02"
            eyebrow="The operating loop"
            title={
              <>
                One companion,
                <br />
                from first brief to production.
              </>
            }
          />
          <p className="reveal max-w-sm text-[13.5px] leading-relaxed text-white/45 lg:pb-2">
            Not another chat window. A structured implementation loop that keeps
            context, artifacts and verification in one place.
          </p>
        </div>

        <div className="reveal relative mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative flex flex-col bg-[#09070e] p-5 transition-colors duration-300 hover:bg-[#0d0a14] sm:p-6 lg:min-h-[290px] lg:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-brand text-[9px] tracking-[0.2em] text-white/25">
                  {step.number}
                </span>
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute h-4 w-4 rounded-full border border-white/[0.08] transition-colors group-hover:border-violet/40" />
                  <span className="h-1 w-1 rounded-full bg-white/25 transition-colors group-hover:bg-violet-soft" />
                </span>
              </div>

              <div className="mt-9 lg:mt-auto lg:pt-12">
                <h3 className="font-display text-[1.05rem] font-medium tracking-tight text-white/90">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-white/40">
                  {step.copy}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <span className="h-1 w-1 rounded-full bg-violet-soft/60" />
                <span className="font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/32">
                  {step.output}
                </span>
              </div>

              {index < steps.length - 1 && (
                <span className="absolute -right-px top-1/2 z-10 hidden h-px w-3 bg-violet/30 lg:block" />
              )}
            </div>
          ))}
        </div>

        <div className="reveal mt-10 grid gap-6 border-t border-white/[0.06] pt-8 sm:grid-cols-3">
          {[
            {
              label: "Persistent context",
              value: "Every decision, file and error stays attached to the project.",
            },
            {
              label: "Honest status",
              value: "Technically verified is never blurred with user-confirmed.",
            },
            {
              label: "No lock-in",
              value: "Export the workflow, code and configuration at any point.",
            },
          ].map((item) => (
            <div key={item.label} className="flex gap-3">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-soft" />
              <div>
                <p className="text-[12px] font-medium text-white/70">
                  {item.label}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/35">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
