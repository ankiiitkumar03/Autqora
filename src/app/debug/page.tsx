import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { DebugWorkbench } from "@/components/site/debug-workbench";

export const metadata: Metadata = {
  title: "Workflow Debugging Helper",
  description:
    "Paste a sanitized automation error to get rule-based troubleshooting suggestions for n8n, Make, Zapier, Python, REST APIs and more.",
};

export default function DebugPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen pt-28 sm:pt-36">
        <section className="relative overflow-hidden pb-12 sm:pb-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-grid opacity-35 [mask-image:radial-gradient(ellipse_65%_65%_at_50%_0%,black,transparent)]" />
            <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet/[0.13] blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-[1120px] px-5 sm:px-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition-colors hover:text-white/75">
              <ArrowLeft className="h-3 w-3" /> Back to AUTQORA
            </Link>
            <div className="mt-7 flex items-center gap-2 font-mono-brand text-[9px] uppercase tracking-[0.2em] text-violet-soft/70">
              <span className="h-1 w-1 rounded-full bg-violet-soft" />
              Early product · Debugging helper
            </div>
            <h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.15rem,8vw,4rem)] leading-[0.98] tracking-[-0.055em] text-mist sm:text-[clamp(3rem,6vw,4rem)]">
              Get a useful next step
              <span className="block text-gradient">when a workflow breaks.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-[14px] leading-relaxed text-white/45 sm:text-[15px]">
              Paste a sanitized error, choose where it happened, and get a likely failure category with practical checks. This first version matches common patterns; it does not inspect your workflow or prove a fix.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-signal/15 bg-signal/[0.035] px-3 py-1.5 text-[10px] text-signal/65">
              <ShieldCheck className="h-3 w-3" />
              No account connection · Inputs aren’t saved by the app · No external AI service
            </div>
          </div>
        </section>
        <DebugWorkbench />
      </main>
      <SiteFooter />
    </>
  );
}
