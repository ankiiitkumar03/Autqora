import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { AqMark } from "@/components/brand/aq-logo";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06]">
      <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="noise relative overflow-hidden rounded-3xl border border-violet/20 bg-[linear-gradient(135deg,#120c22_0%,#0b0813_55%,#0a0810_100%)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_40%,black,transparent)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-violet/20 blur-[110px]" />
          <AqMark
            className="pointer-events-none absolute -bottom-24 -right-16 h-[22rem] w-[22rem] opacity-[0.08]"
            gradientId="cta-mark-gradient"
          />
          <AqMark
            className="pointer-events-none absolute -left-24 -top-24 h-[18rem] w-[18rem] rotate-180 opacity-[0.05]"
            gradientId="cta-mark-gradient-2"
          />

          <div className="relative">
            <p className="font-mono-brand text-[9px] uppercase tracking-[0.32em] text-violet-soft/70">
              Automation. Orchestrated.
            </p>
            <h2 className="mx-auto mt-6 max-w-2xl text-balance font-display text-[clamp(2rem,7vw,3.9rem)] leading-[1.02] tracking-[-0.05em] text-mist">
              Your automation idea is already good.
              <span className="block text-white/38">Let’s make it run.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-white/40">
              Start with a clear brief. Keep the goal and project status in one
              place as AUTQORA grows into the implementation workflow.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/projects"
                className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mist px-6 text-[13px] font-medium text-ink transition-all hover:bg-white hover:shadow-[0_0_44px_-8px_rgba(203,189,255,0.55)] sm:w-auto"
              >
                Create your project
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/debug"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white sm:w-auto"
              >
                <Play className="h-3 w-3" />
                Try the debugging helper
              </Link>
            </div>

            <p className="mt-5 font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/22">
              Private beta · Access by request
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
