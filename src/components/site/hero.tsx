import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { ProductConsole } from "@/components/site/product-console";

const stack = [
  "n8n",
  "Make",
  "Zapier",
  "OpenAI",
  "Claude",
  "Python",
  "REST APIs",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-36 lg:pb-24 lg:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.55] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_8%,black,transparent_78%)]" />
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,70,245,0.28),rgba(108,70,245,0.05)_45%,transparent_70%)] blur-2xl" />
        <div className="absolute left-[14%] top-[28rem] h-72 w-72 rounded-full bg-violet/[0.07] blur-[100px]" />
        <div className="absolute right-[10%] top-[18rem] h-80 w-80 rounded-full bg-[#4b2bd6]/[0.09] blur-[110px]" />

        <div className="absolute left-1/2 top-[7rem] -z-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-white/[0.045] sm:h-[46rem] sm:w-[46rem]" />
        <div className="absolute left-1/2 top-[7rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full border border-white/[0.06] sm:h-[32rem] sm:w-[32rem]" />
        <div className="absolute left-1/2 top-[7rem] h-[15rem] w-[15rem] -translate-x-1/2 rounded-full border border-violet/[0.14] sm:h-[20rem] sm:w-[20rem]" />

        <div className="absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
        <div className="absolute right-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] py-1 pl-1 pr-3.5 backdrop-blur">
            <span className="rounded-full bg-violet/15 px-2 py-1 font-mono-brand text-[8px] uppercase tracking-[0.16em] text-violet-soft">
              New
            </span>
            <span className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-white/50">
              The implementation layer for automation
            </span>
          </div>

          <h1 className="animate-rise animation-delay-1 mt-7 text-balance font-display text-[clamp(2.4rem,8.1vw,5.3rem)] font-medium leading-[0.98] tracking-[-0.055em] text-mist sm:text-[clamp(3.25rem,7vw,5.3rem)]">
            Turn automation ideas
            <br />
            into{" "}
            <span className="text-gradient relative">
              working systems.
              <span className="pointer-events-none absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-violet-soft/50 to-transparent" />
            </span>
          </h1>

          <p className="animate-rise animation-delay-2 mx-auto mt-7 max-w-[39rem] text-pretty text-[15px] leading-relaxed text-white/52 sm:text-[16.5px]">
            Start by saving your automation brief and tracking its progress.
            Project planning, workflow generation and integrations are the next
            pieces being built around it.
          </p>

          <div className="animate-rise animation-delay-3 mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/projects"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mist px-6 text-[13.5px] font-medium text-ink transition-all hover:bg-white hover:shadow-[0_0_40px_-8px_rgba(203,189,255,0.6)] sm:w-auto"
            >
              Create an automation project
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/debug"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-6 text-[13.5px] font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white sm:w-auto"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Try the debugging helper
            </Link>
          </div>

          <div className="animate-rise animation-delay-4 mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-white/32">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-signal/70" />
              Save project briefs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-signal/70" />
              Per-browser workspace
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-signal/70" />
              No integrations yet
            </span>
          </div>
        </div>

        <div className="relative mt-16 sm:mt-20">
          <div className="pointer-events-none absolute -left-6 top-20 z-20 hidden items-center gap-2 rounded-lg border border-white/[0.09] bg-[#0c0913]/90 px-3 py-2 shadow-2xl backdrop-blur-xl 2xl:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet/12 text-violet-soft">
              <GitBranch className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[9px] font-medium text-white/75">Dedupe added</p>
              <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.12em] text-white/30">
                Architect suggestion
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-5 bottom-28 z-20 hidden items-center gap-2 rounded-lg border border-white/[0.09] bg-[#0c0913]/90 px-3 py-2 shadow-2xl backdrop-blur-xl 2xl:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-signal/10 text-signal">
              <ShieldCheck className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[9px] font-medium text-white/75">
                Example checks passed
              </p>
              <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.12em] text-white/30">
                Sample result
              </p>
            </div>
          </div>

          <ProductConsole />
          <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-white/30">
            Product preview · Illustrative workflow and sample verification results; no live automation is running here.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6 border-t border-white/[0.06] pt-8 sm:mt-16">
          <p className="font-mono-brand text-[9px] uppercase tracking-[0.24em] text-white/28">
            Built for the stack you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-9">
            {stack.map((tool) => (
              <span
                key={tool}
                className="font-display text-[13px] font-medium tracking-tight text-white/35 transition-colors hover:text-white/70"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
