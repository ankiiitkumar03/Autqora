import { KeyRound, Layers, Rocket, TerminalSquare } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";

const problems = [
  {
    icon: Layers,
    title: "Tool selection",
    copy: "Five tools can solve the same problem. Only one fits your budget, your data, and your skill level.",
  },
  {
    icon: KeyRound,
    title: "Auth & API configuration",
    copy: "Keys, scopes, OAuth, rate limits. One wrong field and the chain breaks — often without an obvious error.",
  },
  {
    icon: TerminalSquare,
    title: "Debugging in the dark",
    copy: "Logs tell you what failed. They rarely tell you why, where the fix belongs, or what to change next.",
  },
  {
    icon: Rocket,
    title: "The deployment cliff",
    copy: "No staging, no rollback, no proof it works. So the workflow stays in a draft folder and never ships.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_10%_40%,rgba(124,92,255,0.05),transparent)]" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="01"
              eyebrow="The gap"
              title={
                <>
                  The last mile is
                  <br />
                  <span className="text-white/38">the whole project.</span>
                </>
              }
              description="AI can write an implementation plan in seconds. Getting the automation live, stable and verifiable is where most projects stall."
            />

            <div className="reveal mt-10 max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
              <div className="flex items-center gap-2 font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/30">
                <span className="h-1 w-1 rounded-full bg-violet-soft" />
                The implementation gap
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <div className="text-center">
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[10px] text-white/55">
                    Idea
                  </div>
                  <p className="mt-1.5 font-mono-brand text-[7px] uppercase tracking-[0.12em] text-white/20">
                    Clear
                  </p>
                </div>
                <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-white/5" />
                <div className="text-center">
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[10px] text-white/55">
                    Plan
                  </div>
                  <p className="mt-1.5 font-mono-brand text-[7px] uppercase tracking-[0.12em] text-white/20">
                    Easy
                  </p>
                </div>
                <div className="relative flex flex-1 flex-col items-center">
                  <span className="h-px w-full bg-[repeating-linear-gradient(90deg,rgba(124,92,255,0.6)_0_4px,transparent_4px_8px)]" />
                  <span className="absolute -top-2 rounded-full border border-violet/30 bg-violet/10 px-1.5 py-0.5 font-mono-brand text-[6.5px] uppercase tracking-[0.1em] text-violet-soft">
                    Gap
                  </span>
                </div>
                <div className="text-center">
                  <div className="rounded-lg border border-violet/25 bg-violet/[0.08] px-3 py-2 text-[10px] text-violet-soft">
                    Working
                  </div>
                  <p className="mt-1.5 font-mono-brand text-[7px] uppercase tracking-[0.12em] text-violet-soft/60">
                    The work
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal">
            <div className="border-t border-white/[0.08]">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                return (
                  <div
                    key={problem.title}
                    className="group relative border-b border-white/[0.08] py-7 transition-colors hover:bg-white/[0.015] sm:py-8"
                  >
                    <div className="flex gap-5 sm:gap-7">
                      <span className="mt-1 font-mono-brand text-[9px] tracking-[0.16em] text-white/20">
                        0{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-display text-[1.05rem] font-medium tracking-tight text-white/85 sm:text-[1.15rem]">
                            {problem.title}
                          </h3>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/35 transition-colors group-hover:border-violet/25 group-hover:text-violet-soft">
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                          </span>
                        </div>
                        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/42">
                          {problem.copy}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-start gap-3 border-l border-violet/40 pl-4">
              <p className="max-w-md text-[13.5px] leading-relaxed text-white/45">
                AUTQORA is built for the distance between understanding the
                problem and running the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
